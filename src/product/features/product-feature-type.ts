/**
 * ProductFeatureType — defines a configurable characteristic of a product.
 *
 * WHY: Products have attributes that vary between instances — color, size,
 *      weight, year of production, etc. Rather than hardcoding these as
 *      class fields (which would require new code for each attribute), we
 *      model them as FEATURE TYPES that can be defined at runtime.
 *
 * WHAT: Each ProductFeatureType consists of:
 *       - name: unique identifier ("color", "size", "yearOfProduction")
 *       - constraint: validation rules for acceptable values
 *
 * WHEN: A ProductType declares which feature types it supports as
 *       mandatory or optional. When creating a ProductInstance, you provide
 *       concrete values for these feature types.
 *
 * EXAMPLE LIFECYCLE:
 *   1. Define: ProductFeatureType.withAllowedValues("color", "red", "blue", "green")
 *   2. Attach: productTypeBuilder.withMandatoryFeature(colorFeature)
 *   3. Use:    ProductFeatureInstance.of(colorFeature, "red")
 */

import { checkArgument } from "../shared/preconditions";
import {
  FeatureValueConstraint,
  AllowedValuesConstraint,
  NumericRangeConstraint,
  DecimalRangeConstraint,
  DateRangeConstraint,
  RegexConstraint,
  UnconstrainedConstraint,
} from "./feature-value-constraint";
import { FeatureValueType, featureValueTypeName } from "./feature-value-type";

export class ProductFeatureType {
  readonly name: string;
  readonly constraint: FeatureValueConstraint;

  constructor(name: string, constraint: FeatureValueConstraint) {
    checkArgument(
      name != null && name.trim().length > 0,
      "Feature type name must be defined",
    );
    checkArgument(constraint != null, "Constraint must be defined");
    this.name = name;
    this.constraint = constraint;
  }

  /** Creates a feature type with allowed TEXT values. Example: color ∈ {red, blue, green} */
  static withAllowedValues(
    name: string,
    ...allowedValues: string[]
  ): ProductFeatureType {
    return new ProductFeatureType(name, AllowedValuesConstraint.of(...allowedValues));
  }

  /** Creates a feature type with an integer range. Example: year ∈ [2020, 2024] */
  static withNumericRange(
    name: string,
    min: number,
    max: number,
  ): ProductFeatureType {
    return new ProductFeatureType(name, NumericRangeConstraint.between(min, max));
  }

  /** Creates a feature type with a decimal range. Example: weight ∈ [0.5, 100.0] */
  static withDecimalRange(
    name: string,
    min: string,
    max: string,
  ): ProductFeatureType {
    return new ProductFeatureType(name, DecimalRangeConstraint.of(min, max));
  }

  /** Creates a feature type with a regex pattern. Example: code ~ /^[A-Z]{2}-\d{4}$/ */
  static withRegex(name: string, pattern: string): ProductFeatureType {
    return new ProductFeatureType(name, RegexConstraint.of(pattern));
  }

  /** Creates a feature type with a date range. Example: expiry ∈ [2024-01-01, 2024-12-31] */
  static withDateRange(
    name: string,
    from: string,
    to: string,
  ): ProductFeatureType {
    return new ProductFeatureType(name, DateRangeConstraint.between(from, to));
  }

  /** Creates a feature type with no constraints — any value of the type is valid. */
  static unconstrained(
    name: string,
    valueType: FeatureValueType,
  ): ProductFeatureType {
    return new ProductFeatureType(name, new UnconstrainedConstraint(valueType));
  }

  /** Creates a feature type with a custom constraint. */
  static of(
    name: string,
    constraint: FeatureValueConstraint,
  ): ProductFeatureType {
    return new ProductFeatureType(name, constraint);
  }

  /** Validates whether the given value is valid for this feature type. */
  isValidValue(value: unknown): boolean {
    return this.constraint.isValid(value);
  }

  /** Throws IllegalArgumentError if the value is invalid. */
  validateValue(value: unknown): void {
    checkArgument(value != null, "Feature value must not be null");
    checkArgument(
      this.constraint.isValid(value),
      `Invalid value '${value}' for feature '${this.name}'. Expected: ${this.constraint.desc()}`,
    );
  }

  toString(): string {
    return `ProductFeatureType{name='${this.name}', constraint=${this.constraint.desc()}}`;
  }
}

// ─── ProductFeatureTypeDefinition ─────────────────────────────────────────────

/**
 * Wraps a ProductFeatureType with a mandatory/optional flag.
 *
 * WHY: The same feature type (e.g., "color") might be mandatory for T-shirts
 *      but optional for books. The definition layer separates the "what" (feature type)
 *      from the "how required" (mandatory/optional) decision.
 */
export class ProductFeatureTypeDefinition {
  readonly featureType: ProductFeatureType;
  readonly mandatory: boolean;

  constructor(featureType: ProductFeatureType, mandatory: boolean) {
    checkArgument(featureType != null, "ProductFeatureType must be defined");
    this.featureType = featureType;
    this.mandatory = mandatory;
  }

  static mandatoryOf(featureType: ProductFeatureType): ProductFeatureTypeDefinition {
    return new ProductFeatureTypeDefinition(featureType, true);
  }

  static optionalOf(featureType: ProductFeatureType): ProductFeatureTypeDefinition {
    return new ProductFeatureTypeDefinition(featureType, false);
  }

  get isOptional(): boolean {
    return !this.mandatory;
  }

  toString(): string {
    return `${this.mandatory ? "mandatory" : "optional"}(${this.featureType.name})`;
  }
}

// ─── ProductFeatureTypes (Container) ──────────────────────────────────────────

/**
 * Container for all feature type definitions of a ProductType.
 *
 * WHY: Provides indexed access to features by name, and filtering by
 *      mandatory/optional status. Used during ProductInstance creation
 *      to validate that all mandatory features have values.
 */
export class ProductFeatureTypes {
  private readonly features: ReadonlyMap<string, ProductFeatureTypeDefinition>;

  constructor(definitions: ProductFeatureTypeDefinition[]) {
    const map = new Map<string, ProductFeatureTypeDefinition>();
    for (const def of definitions) {
      map.set(def.featureType.name, def);
    }
    this.features = map;
  }

  static empty(): ProductFeatureTypes {
    return new ProductFeatureTypes([]);
  }

  static of(...definitions: ProductFeatureTypeDefinition[]): ProductFeatureTypes {
    return new ProductFeatureTypes(definitions);
  }

  /** Returns the definition for a given feature name. */
  get(featureName: string): ProductFeatureTypeDefinition | undefined {
    return this.features.get(featureName);
  }

  /** Returns the feature type for a given name. */
  getFeatureType(featureName: string): ProductFeatureType | undefined {
    return this.features.get(featureName)?.featureType;
  }

  /** Checks if a feature with the given name is defined. */
  has(featureName: string): boolean {
    return this.features.has(featureName);
  }

  /** Checks if a feature is mandatory. */
  isMandatory(featureName: string): boolean {
    return this.features.get(featureName)?.mandatory ?? false;
  }

  /** Returns all mandatory feature types. */
  mandatoryFeatures(): ProductFeatureType[] {
    return [...this.features.values()]
      .filter((d) => d.mandatory)
      .map((d) => d.featureType);
  }

  /** Returns all optional feature types. */
  optionalFeatures(): ProductFeatureType[] {
    return [...this.features.values()]
      .filter((d) => !d.mandatory)
      .map((d) => d.featureType);
  }

  /** Returns all feature types (both mandatory and optional). */
  allFeatures(): ProductFeatureType[] {
    return [...this.features.values()].map((d) => d.featureType);
  }

  get size(): number {
    return this.features.size;
  }

  get isEmpty(): boolean {
    return this.features.size === 0;
  }

  toString(): string {
    return `ProductFeatureTypes{mandatory=${this.mandatoryFeatures().length}, optional=${this.optionalFeatures().length}}`;
  }
}
