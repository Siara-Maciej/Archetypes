/**
 * Validity — a time range during which something is valid (e.g., a catalog entry).
 *
 * WHY: Many domain concepts have temporal boundaries — a product offer is valid
 *      from January to March, a promotion runs until end of month, a certificate
 *      is valid after issuance. Validity captures this as a first-class concept
 *      rather than scattering `fromDate`/`toDate` pairs across the codebase.
 *
 * WHAT: An immutable date range with optional boundaries:
 *       - `from` only  → valid from that date onwards (no end)
 *       - `to` only    → valid until that date (no start constraint)
 *       - both         → valid within the closed range [from, to]
 *       - neither      → always valid
 *
 * HOW: Dates are represented as ISO 8601 strings ("2024-01-15") to avoid
 *      JavaScript Date timezone pitfalls. Comparisons use string ordering
 *      which works correctly for ISO date format.
 *
 * This is a VALUE OBJECT — immutable, compared by its boundaries.
 */

import { checkArgument } from "../shared/preconditions";

export class Validity {
  /** Start of validity period (inclusive), or undefined if open-ended. */
  readonly from: string | undefined;
  /** End of validity period (inclusive), or undefined if open-ended. */
  readonly to: string | undefined;

  private constructor(from: string | undefined, to: string | undefined) {
    this.from = from;
    this.to = to;
  }

  /** Creates a Validity that starts from the given date (no end). */
  static fromDate(from: string): Validity {
    checkArgument(from != null, "from date must be defined");
    return new Validity(from, undefined);
  }

  /** Creates a Validity that ends at the given date (no start). */
  static until(to: string): Validity {
    checkArgument(to != null, "to date must be defined");
    return new Validity(undefined, to);
  }

  /** Creates a Validity for a closed date range [from, to]. */
  static between(from: string, to: string): Validity {
    checkArgument(from != null, "from date must be defined");
    checkArgument(to != null, "to date must be defined");
    checkArgument(from <= to, "from must be before or equal to to");
    return new Validity(from, to);
  }

  /** Creates a Validity that is always valid (no boundaries). */
  static always(): Validity {
    return new Validity(undefined, undefined);
  }

  /**
   * Checks whether the given date falls within the validity period.
   *
   * @param date - an ISO date string ("2024-06-15")
   * @returns true if the date is within [from, to] (inclusive on both ends)
   */
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
    if (this.from == null && this.to == null) return "always";
    if (this.from != null && this.to == null) return `from ${this.from}`;
    if (this.from == null && this.to != null) return `until ${this.to}`;
    return `${this.from} to ${this.to}`;
  }
}
