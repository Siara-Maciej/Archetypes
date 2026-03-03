/**
 * FeatureValueConstraint — validation rules for product feature values.
 *
 * WHY: Product features need more than just type checking. A "color" feature
 *      should only accept values from {red, blue, green}, a "year" feature
 *      should be between 2020 and 2024, a "product code" must match a regex.
 *      Constraints define these rules declaratively.
 *
 * WHAT: Each constraint combines:
 *       - VALUE TYPE: what kind of data (TEXT, INTEGER, DECIMAL, DATE, BOOLEAN)
 *       - VALIDATION: specific rules for allowed values
 *       - SERIALIZATION: converting to/from strings for persistence
 *       - DESCRIPTION: human-readable explanation
 *
 * IMPLEMENTATIONS:
 *   AllowedValues   — value must be one of a predefined set (enum-like)
 *   NumericRange    — integer in range [min, max]
 *   DecimalRange    — number in range [min, max]
 *   DateRange       — ISO date in range [from, to]
 *   Regex           — text matching a regular expression
 *   Unconstrained   — any value of the specified type
 *
 * HOW: Discriminated union with `constraintType` tag. Factory functions
 *      create each variant with validation at construction time.
 */

import { checkArgument } from "../shared/preconditions";
import {
  FeatureValueType,
  isInstanceOf,
  castFrom,
  castTo,
} from "./feature-value-type";

// ─── Constraint Interface ─────────────────────────────────────────────────────

export interface FeatureValueConstraint {
  /** The data type this constraint validates. */
  readonly valueType: FeatureValueType;
  /** Constraint type identifier for persistence/deserialization. */
  readonly constraintType: string;
  /** Checks whether the given value satisfies this constraint. */
  isValid(value: unknown): boolean;
  /** Human-readable description of the constraint. */
  desc(): string;
  /** Converts value to string for persistence. */
  toString(value: unknown): string;
  /** Parses value from string, validating against this constraint. */
  fromString(value: string): unknown;
}

// ─── AllowedValues ────────────────────────────────────────────────────────────

/**
 * Restricts TEXT values to a predefined set.
 * Example: color must be one of {red, blue, green}.
 */
export class AllowedValuesConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.TEXT;
  readonly constraintType = "ALLOWED_VALUES";
  readonly allowedValues: ReadonlySet<string>;

  constructor(allowedValues: Set<string>) {
    checkArgument(
      allowedValues != null && allowedValues.size > 0,
      "Allowed values must not be empty",
    );
    this.allowedValues = new Set(allowedValues);
  }

  static of(...values: string[]): AllowedValuesConstraint {
    checkArgument(values.length > 0, "Allowed values must not be empty");
    return new AllowedValuesConstraint(new Set(values));
  }

  isValid(value: unknown): boolean {
    return typeof value === "string" && this.allowedValues.has(value);
  }

  desc(): string {
    return `one of: {${[...this.allowedValues].join(", ")}}`;
  }

  toString(value: unknown): string {
    return castTo(this.valueType, value);
  }

  fromString(value: string): unknown {
    if (!this.allowedValues.has(value)) {
      throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
    }
    return value;
  }
}

// ─── NumericRange ─────────────────────────────────────────────────────────────

/**
 * Restricts INTEGER values to range [min, max].
 * Example: year of production between 2020 and 2024.
 */
export class NumericRangeConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.INTEGER;
  readonly constraintType = "NUMERIC_RANGE";

  constructor(
    readonly min: number,
    readonly max: number,
  ) {
    checkArgument(min <= max, "min must be less than or equal to max");
  }

  static between(min: number, max: number): NumericRangeConstraint {
    return new NumericRangeConstraint(min, max);
  }

  isValid(value: unknown): boolean {
    if (typeof value !== "number" || !Number.isInteger(value)) return false;
    return value >= this.min && value <= this.max;
  }

  desc(): string {
    return `integer between ${this.min} and ${this.max}`;
  }

  toString(value: unknown): string {
    return castTo(this.valueType, value);
  }

  fromString(value: string): unknown {
    const parsed = castFrom(this.valueType, value);
    if (!this.isValid(parsed)) {
      throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
    }
    return parsed;
  }
}

// ─── DecimalRange ─────────────────────────────────────────────────────────────

/**
 * Restricts DECIMAL values to range [min, max].
 * Example: weight between 0.5 and 100.0 kg.
 */
export class DecimalRangeConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.DECIMAL;
  readonly constraintType = "DECIMAL_RANGE";

  constructor(
    readonly min: number,
    readonly max: number,
  ) {
    checkArgument(min <= max, "min must be less than or equal to max");
  }

  static of(min: string, max: string): DecimalRangeConstraint {
    return new DecimalRangeConstraint(parseFloat(min), parseFloat(max));
  }

  static between(min: number, max: number): DecimalRangeConstraint {
    return new DecimalRangeConstraint(min, max);
  }

  isValid(value: unknown): boolean {
    if (typeof value !== "number") return false;
    return value >= this.min && value <= this.max;
  }

  desc(): string {
    return `decimal between ${this.min} and ${this.max}`;
  }

  toString(value: unknown): string {
    return castTo(this.valueType, value);
  }

  fromString(value: string): unknown {
    const parsed = castFrom(this.valueType, value);
    if (!this.isValid(parsed)) {
      throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
    }
    return parsed;
  }
}

// ─── DateRange ────────────────────────────────────────────────────────────────

/**
 * Restricts DATE values to range [from, to].
 * Example: expiry date between 2024-01-01 and 2024-12-31.
 */
export class DateRangeConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.DATE;
  readonly constraintType = "DATE_RANGE";

  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    checkArgument(from != null, "from date must be defined");
    checkArgument(to != null, "to date must be defined");
    checkArgument(from <= to, "from must be before or equal to to");
  }

  static between(from: string, to: string): DateRangeConstraint {
    return new DateRangeConstraint(from, to);
  }

  isValid(value: unknown): boolean {
    if (!isInstanceOf(FeatureValueType.DATE, value)) return false;
    const date = value as string;
    return date >= this.from && date <= this.to;
  }

  desc(): string {
    return `date between ${this.from} and ${this.to}`;
  }

  toString(value: unknown): string {
    return castTo(this.valueType, value);
  }

  fromString(value: string): unknown {
    const parsed = castFrom(this.valueType, value);
    if (!this.isValid(parsed)) {
      throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
    }
    return parsed;
  }
}

// ─── Regex ────────────────────────────────────────────────────────────────────

/**
 * Validates TEXT values against a regular expression pattern.
 * Example: product code must match "^[A-Z]{2}-\d{4}$".
 */
export class RegexConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.TEXT;
  readonly constraintType = "REGEX";
  readonly pattern: RegExp;
  readonly patternString: string;

  constructor(pattern: string) {
    checkArgument(
      pattern != null && pattern.trim().length > 0,
      "Pattern must be defined",
    );
    this.patternString = pattern;
    this.pattern = new RegExp(pattern);
  }

  static of(pattern: string): RegexConstraint {
    return new RegexConstraint(pattern);
  }

  isValid(value: unknown): boolean {
    if (typeof value !== "string") return false;
    return this.pattern.test(value);
  }

  desc(): string {
    return `text matching pattern: ${this.patternString}`;
  }

  toString(value: unknown): string {
    return castTo(this.valueType, value);
  }

  fromString(value: string): unknown {
    if (!this.isValid(value)) {
      throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
    }
    return value;
  }
}

// ─── Unconstrained ────────────────────────────────────────────────────────────

/**
 * No constraints — any value of the specified type is valid.
 * Example: free-form comment field (any text), any integer.
 */
export class UnconstrainedConstraint implements FeatureValueConstraint {
  readonly constraintType = "UNCONSTRAINED";

  constructor(readonly valueType: FeatureValueType) {
    checkArgument(valueType != null, "Value type must be defined");
  }

  isValid(value: unknown): boolean {
    return isInstanceOf(this.valueType, value);
  }

  desc(): string {
    return `any ${this.valueType.toLowerCase()}`;
  }

  toString(value: unknown): string {
    return castTo(this.valueType, value);
  }

  fromString(value: string): unknown {
    const parsed = castFrom(this.valueType, value);
    if (!this.isValid(parsed)) {
      throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
    }
    return parsed;
  }
}
