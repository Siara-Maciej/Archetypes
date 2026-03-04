/**
 * Validity — a time range during which something is valid.
 *
 * Immutable value object with optional boundaries.
 * Dates are ISO 8601 strings ("2024-01-15").
 */
export class Validity {
  readonly from: string | undefined;
  readonly to: string | undefined;

  private constructor(from: string | undefined, to: string | undefined) {
    this.from = from;
    this.to = to;
  }

  static fromDate(from: string): Validity {
    return new Validity(from, undefined);
  }

  static until(to: string): Validity {
    return new Validity(undefined, to);
  }

  static between(from: string, to: string): Validity {
    if (from > to) throw new Error('from must be before or equal to to');
    return new Validity(from, to);
  }

  static always(): Validity {
    return new Validity(undefined, undefined);
  }

  isValidAt(date: string): boolean {
    if (date == null) return false;
    if (this.from != null && date < this.from) return false;
    if (this.to != null && date > this.to) return false;
    return true;
  }

  equals(other: Validity): boolean {
    return this.from === other.from && this.to === other.to;
  }

  toString(): string {
    if (this.from == null && this.to == null) return 'always';
    if (this.from != null && this.to == null) return `from ${this.from}`;
    if (this.from == null && this.to != null) return `until ${this.to}`;
    return `${this.from} to ${this.to}`;
  }
}
