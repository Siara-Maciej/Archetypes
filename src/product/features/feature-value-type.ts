/**
 * FeatureValueType — the set of allowed data types for product feature values.
 *
 * WHY: Product features (color, size, weight, expiry date) carry values of
 *      different types. We need a CLOSED set of supported types so that:
 *      1. Persistence layer knows how to serialize/deserialize every value
 *      2. Constraints can validate values against the correct type
 *      3. API consumers know exactly what types to expect
 *
 * WHAT: Five types that cover all practical product feature needs:
 *       TEXT    — free-form strings ("red", "XL", "AB-1234")
 *       INTEGER — whole numbers (year of production, quantity)
 *       DECIMAL — fractional numbers (weight, price, dimensions)
 *       DATE    — calendar dates as ISO strings (expiry, manufacture date)
 *       BOOLEAN — true/false flags (organic, fragile, refurbished)
 *
 * HOW: Each type knows how to:
 *      - `castFrom(string)` — parse from persistence format
 *      - `castTo(value)`    — serialize to persistence format
 *      - `isInstance(value)` — runtime type check
 *
 * NOTE: In TypeScript we use `number` for both INTEGER and DECIMAL.
 *       The constraint layer (NumericRangeConstraint vs DecimalRangeConstraint)
 *       enforces the distinction (integer-ness checked via Number.isInteger).
 *       Dates are ISO 8601 strings to avoid JS Date timezone pitfalls.
 */

export enum FeatureValueType {
  TEXT = "TEXT",
  INTEGER = "INTEGER",
  DECIMAL = "DECIMAL",
  DATE = "DATE",
  BOOLEAN = "BOOLEAN",
}

/** Runtime type name for display/errors. */
export function featureValueTypeName(type: FeatureValueType): string {
  switch (type) {
    case FeatureValueType.TEXT:
      return "string";
    case FeatureValueType.INTEGER:
      return "integer";
    case FeatureValueType.DECIMAL:
      return "number";
    case FeatureValueType.DATE:
      return "date (ISO string)";
    case FeatureValueType.BOOLEAN:
      return "boolean";
  }
}

/** Checks if a value matches the expected runtime type. */
export function isInstanceOf(type: FeatureValueType, value: unknown): boolean {
  switch (type) {
    case FeatureValueType.TEXT:
      return typeof value === "string";
    case FeatureValueType.INTEGER:
      return typeof value === "number" && Number.isInteger(value);
    case FeatureValueType.DECIMAL:
      return typeof value === "number";
    case FeatureValueType.DATE:
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    case FeatureValueType.BOOLEAN:
      return typeof value === "boolean";
  }
}

/** Parses a value from its string (persistence) representation. */
export function castFrom(type: FeatureValueType, value: string): unknown {
  switch (type) {
    case FeatureValueType.TEXT:
      return value;
    case FeatureValueType.INTEGER: {
      const n = parseInt(value, 10);
      if (isNaN(n)) throw new Error(`Cannot parse integer from: "${value}"`);
      return n;
    }
    case FeatureValueType.DECIMAL: {
      const n = parseFloat(value);
      if (isNaN(n)) throw new Error(`Cannot parse decimal from: "${value}"`);
      return n;
    }
    case FeatureValueType.DATE: {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        throw new Error(`Cannot parse date from: "${value}"`);
      return value;
    }
    case FeatureValueType.BOOLEAN:
      return value === "true";
  }
}

/** Converts a value to its string (persistence) representation. */
export function castTo(type: FeatureValueType, value: unknown): string {
  return String(value);
}
