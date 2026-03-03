/**
 * CatalogEntry — a commercial offering position.
 *
 * WHY: Product (ProductType/PackageType) defines WHAT something IS from a business
 *      perspective. CatalogEntry defines that it's FOR SALE — with marketing name,
 *      sales copy, categories for navigation, validity period, and flexible metadata.
 *
 * KEY DISTINCTION:
 *   Product:      "iPhone 15 Pro 256GB" (technical/operational definition)
 *   CatalogEntry: "iPhone 15 Pro — The most powerful iPhone ever!" (commercial view)
 *
 * The same ProductType can appear in MULTIPLE catalog entries — different campaigns,
 * different markets, different time periods. That's why CatalogEntry has its own ID.
 *
 * IMMUTABILITY: CatalogEntry supports copy-on-write via `withValidity()` and
 *               `withMetadata()` — these return new instances, never mutate.
 */

import { randomUUID } from "crypto";
import { checkArgument } from "../shared/preconditions";
import { Product } from "../domain/product";
import { Validity } from "../value-objects/validity";

// ─── CatalogEntryId ───────────────────────────────────────────────────────────

export class CatalogEntryId {
  readonly value: string;

  private constructor(value: string) {
    checkArgument(
      value != null && value.trim().length > 0,
      "CatalogEntryId must be defined",
    );
    this.value = value;
  }

  static of(value: string): CatalogEntryId {
    return new CatalogEntryId(value);
  }

  static generate(): CatalogEntryId {
    return new CatalogEntryId(`CATALOG-${randomUUID()}`);
  }

  toString(): string {
    return this.value;
  }
}

// ─── CatalogEntry ─────────────────────────────────────────────────────────────

export class CatalogEntry {
  readonly id: CatalogEntryId;
  readonly displayName: string;
  readonly description: string;
  readonly product: Product;
  readonly categories: ReadonlySet<string>;
  readonly validity: Validity;
  readonly metadata: Readonly<Record<string, string>>;

  private constructor(
    id: CatalogEntryId,
    displayName: string,
    description: string,
    product: Product,
    categories: Set<string>,
    validity: Validity,
    metadata: Record<string, string>,
  ) {
    checkArgument(id != null, "CatalogEntryId must be defined");
    checkArgument(
      displayName != null && displayName.trim().length > 0,
      "Display name must be defined",
    );
    checkArgument(
      description != null && description.trim().length > 0,
      "Description must be defined",
    );
    checkArgument(product != null, "Product must be defined");
    checkArgument(validity != null, "Validity must be defined");

    this.id = id;
    this.displayName = displayName;
    this.description = description;
    this.product = product;
    this.categories = new Set(categories);
    this.validity = validity;
    this.metadata = { ...metadata };
  }

  static builder(): CatalogEntryBuilder {
    return new CatalogEntryBuilder();
  }

  /** Checks if available for purchase at the given ISO date. */
  isAvailableAt(date: string): boolean {
    return this.validity.isValidAt(date);
  }

  /** Checks if entry belongs to the given category. */
  isInCategory(category: string): boolean {
    return this.categories.has(category);
  }

  getMetadata(key: string): string | undefined {
    return this.metadata[key];
  }

  getMetadataOrDefault(key: string, defaultValue: string): string {
    return this.metadata[key] ?? defaultValue;
  }

  hasMetadata(key: string): boolean {
    return key in this.metadata;
  }

  /** Returns a NEW entry with updated validity (immutable copy). */
  withValidity(newValidity: Validity): CatalogEntry {
    return new CatalogEntry(
      this.id,
      this.displayName,
      this.description,
      this.product,
      new Set(this.categories),
      newValidity,
      { ...this.metadata },
    );
  }

  /** Returns a NEW entry with updated metadata (immutable copy). */
  withMetadata(newMetadata: Record<string, string>): CatalogEntry {
    return new CatalogEntry(
      this.id,
      this.displayName,
      this.description,
      this.product,
      new Set(this.categories),
      this.validity,
      newMetadata,
    );
  }

  toString(): string {
    return `CatalogEntry{id=${this.id}, displayName='${this.displayName}', product=${this.product.name}}`;
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────────

class CatalogEntryBuilder {
  private _id: CatalogEntryId | undefined;
  private _displayName: string = "";
  private _description: string = "";
  private _product: Product | undefined;
  private _categories = new Set<string>();
  private _validity: Validity | undefined;
  private _metadata: Record<string, string> = {};

  id(id: CatalogEntryId): CatalogEntryBuilder {
    this._id = id;
    return this;
  }
  displayName(name: string): CatalogEntryBuilder {
    this._displayName = name;
    return this;
  }
  description(desc: string): CatalogEntryBuilder {
    this._description = desc;
    return this;
  }
  product(product: Product): CatalogEntryBuilder {
    this._product = product;
    return this;
  }
  categories(cats: Set<string>): CatalogEntryBuilder {
    this._categories = new Set(cats);
    return this;
  }
  category(cat: string): CatalogEntryBuilder {
    this._categories.add(cat);
    return this;
  }
  validity(validity: Validity): CatalogEntryBuilder {
    this._validity = validity;
    return this;
  }
  metadata(metadata: Record<string, string>): CatalogEntryBuilder {
    this._metadata = { ...metadata };
    return this;
  }
  withMetadata(key: string, value: string): CatalogEntryBuilder {
    this._metadata[key] = value;
    return this;
  }

  build(): CatalogEntry {
    // @ts-expect-error — accessing private constructor via builder pattern
    return new CatalogEntry(
      this._id!,
      this._displayName,
      this._description,
      this._product!,
      this._categories,
      this._validity!,
      this._metadata,
    );
  }
}
