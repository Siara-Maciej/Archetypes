/**
 * ProductCatalog — application service for managing commercial product offerings.
 *
 * WHY: Manages the "storefront" — what products are currently available for purchase,
 *      with marketing names, categories, validity periods, and metadata. Separates
 *      the commercial view from the operational product definition.
 *
 * WHAT: Commands to add/discontinue/update catalog entries, and queries to search.
 */

import { Result } from "../shared/result";
import { Validity } from "../value-objects/validity";
import { CatalogEntryId, CatalogEntry } from "../catalog/catalog-entry";
import {
  CatalogEntryRepository,
  ProductTypeRepository,
} from "../repositories/repositories";
import { AddToOffer, DiscontinueProduct, UpdateMetadata } from "../cqrs/commands";
import {
  SearchCatalogCriteria,
  FindCatalogEntryCriteria,
  FindByCategoryCriteria,
  FindAvailableAtCriteria,
  FindByMetadataCriteria,
} from "../cqrs/queries";
import { CatalogEntryView } from "../cqrs/views";

export class ProductCatalog {
  constructor(
    private readonly catalogRepository: CatalogEntryRepository,
    private readonly productTypeRepository: ProductTypeRepository,
  ) {}

  /** Adds a ProductType to the commercial offer. */
  handleAddToOffer(command: AddToOffer): Result<string, CatalogEntryId> {
    try {
      const productType = this.productTypeRepository.findByIdValue(
        command.productTypeId,
      );
      if (!productType)
        return Result.failure(
          `ProductType not found: ${command.productTypeId}`,
        );

      const validity = buildValidity(command.availableFrom, command.availableUntil);
      const catalogEntryId = CatalogEntryId.generate();

      const entry = CatalogEntry.builder()
        .id(catalogEntryId)
        .displayName(command.displayName)
        .description(command.description)
        .product(productType)
        .categories(command.categories ?? new Set())
        .validity(validity)
        .metadata(command.metadata ?? {})
        .build();

      this.catalogRepository.save(entry);
      return Result.success(catalogEntryId);
    } catch (e) {
      return Result.failure(String((e as Error).message));
    }
  }

  /** Discontinues a product from the offer. */
  handleDiscontinue(
    command: DiscontinueProduct,
  ): Result<string, CatalogEntryId> {
    try {
      const id = CatalogEntryId.of(command.catalogEntryId);
      const entry = this.catalogRepository.findById(id);
      if (!entry)
        return Result.failure(
          `Catalog entry not found: ${command.catalogEntryId}`,
        );

      const newValidity = entry.validity.from != null
        ? Validity.between(entry.validity.from, command.discontinuationDate)
        : Validity.until(command.discontinuationDate);

      this.catalogRepository.save(entry.withValidity(newValidity));
      return Result.success(id);
    } catch (e) {
      return Result.failure(String((e as Error).message));
    }
  }

  /** Updates metadata of a catalog entry. */
  handleUpdateMetadata(
    command: UpdateMetadata,
  ): Result<string, CatalogEntryId> {
    try {
      const id = CatalogEntryId.of(command.catalogEntryId);
      const entry = this.catalogRepository.findById(id);
      if (!entry)
        return Result.failure(
          `Catalog entry not found: ${command.catalogEntryId}`,
        );

      this.catalogRepository.save(entry.withMetadata(command.metadata));
      return Result.success(id);
    } catch (e) {
      return Result.failure(String((e as Error).message));
    }
  }

  /** Searches catalog with multiple filters. */
  search(criteria: SearchCatalogCriteria): CatalogEntryView[] {
    return this.catalogRepository
      .findAll()
      .filter((e) => matchesSearchText(e, criteria.searchText))
      .filter((e) => matchesCategories(e, criteria.categories))
      .filter((e) => matchesAvailability(e, criteria.availableAt))
      .filter((e) => matchesProductType(e, criteria.productTypeId))
      .map(toCatalogEntryView);
  }

  /** Finds a catalog entry by its ID. */
  findById(
    criteria: FindCatalogEntryCriteria,
  ): CatalogEntryView | undefined {
    const entry = this.catalogRepository.findById(
      CatalogEntryId.of(criteria.catalogEntryId),
    );
    return entry ? toCatalogEntryView(entry) : undefined;
  }

  /** Finds catalog entries by category. */
  findByCategory(criteria: FindByCategoryCriteria): CatalogEntryView[] {
    return this.catalogRepository
      .findByCategory(criteria.category)
      .map(toCatalogEntryView);
  }

  /** Finds catalog entries available at a specific date. */
  findAvailableAt(criteria: FindAvailableAtCriteria): CatalogEntryView[] {
    return this.catalogRepository
      .findAll()
      .filter((e) => e.isAvailableAt(criteria.date))
      .map(toCatalogEntryView);
  }

  /** Finds catalog entries by metadata key/value. */
  findByMetadata(criteria: FindByMetadataCriteria): CatalogEntryView[] {
    return this.catalogRepository
      .findAll()
      .filter((e) => {
        if (criteria.value == null) return e.hasMetadata(criteria.key);
        return e.getMetadata(criteria.key) === criteria.value;
      })
      .map(toCatalogEntryView);
  }
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function matchesSearchText(
  entry: CatalogEntry,
  searchText?: string,
): boolean {
  if (!searchText) return true;
  const lower = searchText.toLowerCase();
  return (
    entry.displayName.toLowerCase().includes(lower) ||
    entry.description.toLowerCase().includes(lower)
  );
}

function matchesCategories(
  entry: CatalogEntry,
  categories?: Set<string>,
): boolean {
  if (!categories || categories.size === 0) return true;
  for (const cat of categories) {
    if (entry.isInCategory(cat)) return true;
  }
  return false;
}

function matchesAvailability(entry: CatalogEntry, date?: string): boolean {
  if (!date) return true;
  return entry.isAvailableAt(date);
}

function matchesProductType(
  entry: CatalogEntry,
  productTypeId?: string,
): boolean {
  if (!productTypeId) return true;
  return entry.product.id.value === productTypeId;
}

function buildValidity(from?: string, to?: string): Validity {
  if (from && to) return Validity.between(from, to);
  if (from) return Validity.fromDate(from);
  if (to) return Validity.until(to);
  return Validity.always();
}

function toCatalogEntryView(entry: CatalogEntry): CatalogEntryView {
  return {
    catalogEntryId: entry.id.value,
    displayName: entry.displayName,
    description: entry.description,
    productTypeId: entry.product.id.value,
    categories: [...entry.categories],
    availableFrom: entry.validity.from,
    availableUntil: entry.validity.to,
    metadata: { ...entry.metadata },
  };
}
