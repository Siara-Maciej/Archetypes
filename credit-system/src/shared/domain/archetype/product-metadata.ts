/**
 * ProductMetadata — flexible key-value attributes for any product.
 *
 * Copy-on-write immutable map. Use `.with(key, value)` to create
 * a new instance with an added/updated entry.
 */
export class ProductMetadata {
  private readonly entries: ReadonlyMap<string, string>;

  private constructor(entries: Map<string, string>) {
    this.entries = new Map(entries);
  }

  static empty(): ProductMetadata {
    return new ProductMetadata(new Map());
  }

  static of(record: Record<string, string>): ProductMetadata {
    return new ProductMetadata(new Map(Object.entries(record)));
  }

  get(key: string): string | undefined {
    return this.entries.get(key);
  }

  getOrDefault(key: string, defaultValue: string): string {
    return this.entries.get(key) ?? defaultValue;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  with(key: string, value: string): ProductMetadata {
    const copy = new Map(this.entries);
    copy.set(key, value);
    return new ProductMetadata(copy);
  }

  asRecord(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.entries) result[k] = v;
    return result;
  }

  get size(): number {
    return this.entries.size;
  }

  toString(): string {
    return `ProductMetadata{${JSON.stringify(this.asRecord())}}`;
  }
}
