/**
 * ProductIdentifier — unique identity for a Product (type-level, not instance-level).
 *
 * WHY: Products need a stable, globally unique identity that survives across
 *      system boundaries (APIs, databases, inter-service communication).
 *      Different industries use different identification schemes — retail uses
 *      GTIN barcodes, publishing uses ISBN, while internal systems often use UUIDs.
 *
 * WHAT: A polymorphic identifier supporting multiple schemes:
 *       - UUID:  universally unique, good for internal systems
 *       - ISBN:  International Standard Book Number (10-digit with check digit)
 *       - GTIN:  Global Trade Item Number (barcode: 8, 12, 13, or 14 digits)
 *
 * HOW: Discriminated union with `idType` tag. Each variant validates its format
 *      at construction time (check digits, length rules). Two identifiers are
 *      equal if they have the same type and the same value.
 *
 * This is a VALUE OBJECT — immutable, compared by value, no identity of its own.
 */

import { randomUUID } from "crypto";
import { checkArgument } from "../shared/preconditions";

// ─── Discriminated Union ──────────────────────────────────────────────────────

export type ProductIdentifier =
  | UuidProductIdentifier
  | IsbnProductIdentifier
  | GtinProductIdentifier;

// ─── UUID Variant ─────────────────────────────────────────────────────────────

/**
 * UUID-based product identifier.
 * Best for internal systems where no industry standard ID exists.
 */
export interface UuidProductIdentifier {
  readonly idType: "UUID";
  readonly value: string;
}

export const UuidProductIdentifier = {
  /**
   * Creates a new random UUID identifier.
   */
  random(): UuidProductIdentifier {
    return { idType: "UUID", value: randomUUID() };
  },

  /**
   * Creates a UUID identifier from an existing string.
   */
  of(value: string): UuidProductIdentifier {
    checkArgument(
      value != null && value.trim().length > 0,
      "UUID value must not be blank",
    );
    return { idType: "UUID", value };
  },
};

// ─── ISBN Variant ─────────────────────────────────────────────────────────────

/**
 * ISBN-10 product identifier (International Standard Book Number).
 * Used in publishing. Validates the check digit using the modulo-11 algorithm.
 */
export interface IsbnProductIdentifier {
  readonly idType: "ISBN";
  readonly value: string;
}

export const IsbnProductIdentifier = {
  of(value: string): IsbnProductIdentifier {
    checkArgument(value != null && value.length === 10, "ISBN must be 10 characters");
    checkArgument(isValidIsbn10(value), `Invalid ISBN-10 check digit: ${value}`);
    return { idType: "ISBN", value };
  },
};

/**
 * ISBN-10 check digit validation (modulo 11 with 'X' = 10).
 *
 * Algorithm: multiply each digit by its position (1-10), sum, check mod 11 === 0.
 */
function isValidIsbn10(isbn: string): boolean {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = isbn[i];
    const digit = ch === "X" || ch === "x" ? 10 : parseInt(ch, 10);
    if (isNaN(digit)) return false;
    sum += digit * (10 - i);
  }
  return sum % 11 === 0;
}

// ─── GTIN Variant ─────────────────────────────────────────────────────────────

/**
 * GTIN product identifier (Global Trade Item Number — barcode).
 * Supports GTIN-8, GTIN-12, GTIN-13, and GTIN-14.
 * Validates format (digits only) and check digit (modulo 10 algorithm).
 */
export interface GtinProductIdentifier {
  readonly idType: "GTIN";
  readonly value: string;
}

export const GtinProductIdentifier = {
  of(value: string): GtinProductIdentifier {
    checkArgument(value != null, "GTIN value must not be null");
    checkArgument(
      [8, 12, 13, 14].includes(value.length),
      `GTIN must be 8, 12, 13, or 14 digits, got ${value.length}`,
    );
    checkArgument(/^\d+$/.test(value), "GTIN must contain only digits");
    checkArgument(isValidGtinCheckDigit(value), `Invalid GTIN check digit: ${value}`);
    return { idType: "GTIN", value };
  },
};

/**
 * GTIN check digit validation (standard modulo 10 / "Luhn-like" algorithm).
 *
 * Working from right to left, alternating multipliers of 1 and 3.
 * The total (including check digit) must be divisible by 10.
 */
function isValidGtinCheckDigit(gtin: string): boolean {
  let sum = 0;
  for (let i = gtin.length - 1; i >= 0; i--) {
    const digit = parseInt(gtin[i], 10);
    const position = gtin.length - 1 - i;
    sum += position % 2 === 0 ? digit : digit * 3;
  }
  return sum % 10 === 0;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Parses a ProductIdentifier from type string + value.
 * Used by facades to convert API input into domain objects.
 */
export function parseProductIdentifier(
  type: string,
  value: string,
): ProductIdentifier {
  switch (type.toUpperCase()) {
    case "UUID":
      return UuidProductIdentifier.of(value);
    case "ISBN":
      return IsbnProductIdentifier.of(value);
    case "GTIN":
      return GtinProductIdentifier.of(value);
    default:
      throw new Error(`Unknown product identifier type: ${type}`);
  }
}

/**
 * Compares two ProductIdentifiers for value equality.
 */
export function productIdentifierEquals(
  a: ProductIdentifier,
  b: ProductIdentifier,
): boolean {
  return a.idType === b.idType && a.value === b.value;
}

/**
 * Returns a stable string key for use in Maps/Sets.
 */
export function productIdentifierKey(id: ProductIdentifier): string {
  return `${id.idType}:${id.value}`;
}
