/**
 * FeatureValueConstraint — validation rules for product feature values.
 *
 * Each constraint combines:
 *   - VALUE TYPE: what kind of data (TEXT, INTEGER, DECIMAL, DATE, BOOLEAN)
 *   - VALIDATION: specific rules for allowed values
 *   - DESCRIPTION: human-readable explanation
 */

// ─── FeatureValueType ─────────────────────────────────────────────────────────

export enum FeatureValueType {
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
}

export function isInstanceOf(type: FeatureValueType, value: unknown): boolean {
  switch (type) {
    case FeatureValueType.TEXT:
      return typeof value === 'string';
    case FeatureValueType.INTEGER:
      return typeof value === 'number' && Number.isInteger(value);
    case FeatureValueType.DECIMAL:
      return typeof value === 'number';
    case FeatureValueType.DATE:
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    case FeatureValueType.BOOLEAN:
      return typeof value === 'boolean';
  }
}

// ─── Constraint Interface ─────────────────────────────────────────────────────

export interface FeatureValueConstraint {
  readonly valueType: FeatureValueType;
  readonly constraintType: string;
  isValid(value: unknown): boolean;
  desc(): string;
}

// ─── AllowedValues ────────────────────────────────────────────────────────────

export class AllowedValuesConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.TEXT;
  readonly constraintType = 'ALLOWED_VALUES';
  readonly allowedValues: ReadonlySet<string>;

  constructor(allowedValues: Set<string>) {
    if (!allowedValues || allowedValues.size === 0) {
      throw new Error('Allowed values must not be empty');
    }
    this.allowedValues = new Set(allowedValues);
  }

  static of(...values: string[]): AllowedValuesConstraint {
    return new AllowedValuesConstraint(new Set(values));
  }

  isValid(value: unknown): boolean {
    return typeof value === 'string' && this.allowedValues.has(value);
  }

  desc(): string {
    return `one of: {${[...this.allowedValues].join(', ')}}`;
  }
}

// ─── NumericRange ─────────────────────────────────────────────────────────────

export class NumericRangeConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.INTEGER;
  readonly constraintType = 'NUMERIC_RANGE';

  constructor(
    readonly min: number,
    readonly max: number,
  ) {
    if (min > max) throw new Error('min must be <= max');
  }

  static between(min: number, max: number): NumericRangeConstraint {
    return new NumericRangeConstraint(min, max);
  }

  isValid(value: unknown): boolean {
    if (typeof value !== 'number' || !Number.isInteger(value)) return false;
    return value >= this.min && value <= this.max;
  }

  desc(): string {
    return `integer between ${this.min} and ${this.max}`;
  }
}

// ─── DecimalRange ─────────────────────────────────────────────────────────────

export class DecimalRangeConstraint implements FeatureValueConstraint {
  readonly valueType = FeatureValueType.DECIMAL;
  readonly constraintType = 'DECIMAL_RANGE';

  constructor(
    readonly min: number,
    readonly max: number,
  ) {
    if (min > max) throw new Error('min must be <= max');
  }

  static between(min: number, max: number): DecimalRangeConstraint {
    return new DecimalRangeConstraint(min, max);
  }

  isValid(value: unknown): boolean {
    if (typeof value !== 'number') return false;
    return value >= this.min && value <= this.max;
  }

  desc(): string {
    return `decimal between ${this.min} and ${this.max}`;
  }
}

// ─── Unconstrained ────────────────────────────────────────────────────────────

export class UnconstrainedConstraint implements FeatureValueConstraint {
  readonly constraintType = 'UNCONSTRAINED';

  constructor(readonly valueType: FeatureValueType) {}

  isValid(value: unknown): boolean {
    return isInstanceOf(this.valueType, value);
  }

  desc(): string {
    return `any ${this.valueType.toLowerCase()}`;
  }
}
