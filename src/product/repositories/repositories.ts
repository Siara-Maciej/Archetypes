/**
 * Repositories — data access abstractions for the Product Archetype.
 *
 * WHY: The domain layer should not know about persistence details (database,
 *      file system, API). Repositories provide a clean abstraction — the domain
 *      works with interfaces, and the infrastructure provides implementations.
 *
 * WHAT: Three repositories matching the three aggregate roots:
 *   ProductTypeRepository          — stores ProductType definitions
 *   CatalogEntryRepository         — stores CatalogEntry (commercial offerings)
 *   ProductRelationshipRepository  — stores ProductRelationship (directed edges)
 *
 * IN-MEMORY IMPLEMENTATIONS: Provided for testing and prototyping.
 *   Replace with database-backed implementations for production.
 */

import {
  ProductIdentifier,
  productIdentifierKey,
} from "../value-objects/product-identifier";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { ProductType } from "../domain/product-type";
import { CatalogEntryId, CatalogEntry } from "../catalog/catalog-entry";
import {
  ProductRelationship,
  ProductRelationshipId,
  ProductRelationshipType,
} from "../relationships/product-relationship";

// ─── ProductTypeRepository ────────────────────────────────────────────────────

export interface ProductTypeRepository {
  save(productType: ProductType): void;
  findById(id: ProductIdentifier): ProductType | undefined;
  findByIdValue(idValue: string): ProductType | undefined;
  findAll(): ProductType[];
  findByTrackingStrategy(strategy: ProductTrackingStrategy): ProductType[];
  remove(id: ProductIdentifier): void;
}

export class InMemoryProductTypeRepository implements ProductTypeRepository {
  private readonly storage = new Map<string, ProductType>();

  save(productType: ProductType): void {
    this.storage.set(productIdentifierKey(productType.id), productType);
  }

  findById(id: ProductIdentifier): ProductType | undefined {
    return this.storage.get(productIdentifierKey(id));
  }

  findByIdValue(idValue: string): ProductType | undefined {
    for (const pt of this.storage.values()) {
      if (pt.id.value === idValue) return pt;
    }
    return undefined;
  }

  findAll(): ProductType[] {
    return [...this.storage.values()];
  }

  findByTrackingStrategy(strategy: ProductTrackingStrategy): ProductType[] {
    return [...this.storage.values()].filter(
      (pt) => pt.trackingStrategy === strategy,
    );
  }

  remove(id: ProductIdentifier): void {
    this.storage.delete(productIdentifierKey(id));
  }
}

// ─── CatalogEntryRepository ──────────────────────────────────────────────────

export interface CatalogEntryRepository {
  save(entry: CatalogEntry): void;
  findById(id: CatalogEntryId): CatalogEntry | undefined;
  findAll(): CatalogEntry[];
  findByCategory(category: string): CatalogEntry[];
  remove(id: CatalogEntryId): void;
}

export class InMemoryCatalogEntryRepository implements CatalogEntryRepository {
  private readonly storage = new Map<string, CatalogEntry>();

  save(entry: CatalogEntry): void {
    this.storage.set(entry.id.value, entry);
  }

  findById(id: CatalogEntryId): CatalogEntry | undefined {
    return this.storage.get(id.value);
  }

  findAll(): CatalogEntry[] {
    return [...this.storage.values()];
  }

  findByCategory(category: string): CatalogEntry[] {
    return [...this.storage.values()].filter((e) => e.isInCategory(category));
  }

  remove(id: CatalogEntryId): void {
    this.storage.delete(id.value);
  }
}

// ─── ProductRelationshipRepository ───────────────────────────────────────────

export interface ProductRelationshipRepository {
  save(relationship: ProductRelationship): void;
  findBy(id: ProductRelationshipId): ProductRelationship | undefined;
  findAllRelationsFrom(from: ProductIdentifier): ProductRelationship[];
  findAllRelationsFromWithType(
    from: ProductIdentifier,
    type: ProductRelationshipType,
  ): ProductRelationship[];
  delete(id: ProductRelationshipId): ProductRelationshipId | undefined;
  findMatching(
    predicate: (r: ProductRelationship) => boolean,
  ): ProductRelationship[];
}

export class InMemoryProductRelationshipRepository
  implements ProductRelationshipRepository
{
  private readonly storage = new Map<string, ProductRelationship>();

  save(relationship: ProductRelationship): void {
    this.storage.set(relationship.id.value, relationship);
  }

  findBy(id: ProductRelationshipId): ProductRelationship | undefined {
    return this.storage.get(id.value);
  }

  findAllRelationsFrom(from: ProductIdentifier): ProductRelationship[] {
    const key = productIdentifierKey(from);
    return [...this.storage.values()].filter(
      (r) => productIdentifierKey(r.from) === key,
    );
  }

  findAllRelationsFromWithType(
    from: ProductIdentifier,
    type: ProductRelationshipType,
  ): ProductRelationship[] {
    const key = productIdentifierKey(from);
    return [...this.storage.values()].filter(
      (r) => productIdentifierKey(r.from) === key && r.type === type,
    );
  }

  delete(id: ProductRelationshipId): ProductRelationshipId | undefined {
    const existed = this.storage.has(id.value);
    this.storage.delete(id.value);
    return existed ? id : undefined;
  }

  findMatching(
    predicate: (r: ProductRelationship) => boolean,
  ): ProductRelationship[] {
    return [...this.storage.values()].filter(predicate);
  }
}
