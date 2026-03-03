/**
 * ProductMetadata — arbitrary key-value attributes attached to a product.
 *
 * WHY: Products often carry domain-specific attributes that don't fit into
 *      the core model (e.g., "seasonal=true", "brand=Nike", "origin=Poland").
 *      Rather than bloating the Product entity with optional fields for every
 *      possible attribute, we use a flexible metadata bag.
 *
 * WHAT: An immutable Map<string, string> with convenience accessors.
 *       Every mutation (`.with()`) returns a NEW instance — the original
 *       is never modified. This is critical for domain objects.
 *
 * WHEN TO USE: For attributes that are:
 *       - Not part of the core domain logic (not used in business rules)
 *       - Vary across product types (not universally applicable)
 *       - Needed for display, search, or integration purposes
 *
 * This is a VALUE OBJECT — immutable, compared by content.
 */

export class ProductMetadata {
  private readonly data: ReadonlyMap<string, string>;

  private constructor(data: Map<string, string>) {
    this.data = new Map(data);
  }

  /** Creates empty metadata. */
  static empty(): ProductMetadata {
    return new ProductMetadata(new Map());
  }

  /** Creates metadata from a plain object. */
  static of(entries: Record<string, string>): ProductMetadata {
    return new ProductMetadata(new Map(Object.entries(entries)));
  }

  /** Creates metadata from a Map. */
  static fromMap(map: Map<string, string>): ProductMetadata {
    return new ProductMetadata(new Map(map));
  }

  /** Returns the value for the given key, or undefined if absent. */
  get(key: string): string | undefined {
    return this.data.get(key);
  }

  /** Returns the value for the given key, or the default if absent. */
  getOrDefault(key: string, defaultValue: string): string {
    return this.data.get(key) ?? defaultValue;
  }

  /** Checks whether the given key exists. */
  has(key: string): boolean {
    return this.data.has(key);
  }

  /** Returns a snapshot of all entries as a plain object. */
  asRecord(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.data) {
      result[k] = v;
    }
    return result;
  }

  /**
   * Returns a NEW ProductMetadata with the given key-value added/overwritten.
   * The original instance is unchanged (immutability).
   */
  with(key: string, value: string): ProductMetadata {
    const copy = new Map(this.data);
    copy.set(key, value);
    return new ProductMetadata(copy);
  }

  toString(): string {
    return `ProductMetadata{${JSON.stringify(this.asRecord())}}`;
  }
}
