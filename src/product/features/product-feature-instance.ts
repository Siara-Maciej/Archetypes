/**
 * ProductFeatureInstance — a concrete value for a product feature.
 *
 * WHY: While ProductFeatureType defines WHAT features are possible (e.g., "color"
 *      with values {red, blue, green}), ProductFeatureInstance captures the ACTUAL
 *      value chosen for a specific product instance (e.g., color = "red").
 *
 * WHAT: Pairs a ProductFeatureType with a validated value. The value is checked
 *       against the type's constraint at construction time — invalid instances
 *       cannot exist.
 *
 * WHERE: Used inside ProductInstance to hold the concrete feature values.
 *
 * VALUE TYPES: The `value` field is `unknown` because it can be string, number,
 *              boolean, or date string depending on the feature type. Use the
 *              typed accessors (asString, asInt, etc.) for safe access.
 */

import { checkArgument } from "../shared/preconditions";
import { ProductFeatureType } from "./product-feature-type";
import { ProductFeatureTypes } from "./product-feature-type";

export class ProductFeatureInstance {
  readonly featureType: ProductFeatureType;
  readonly value: unknown;

  constructor(featureType: ProductFeatureType, value: unknown) {
    checkArgument(featureType != null, "ProductFeatureType must be defined");
    checkArgument(value != null, "Feature value must be defined");
    featureType.validateValue(value);
    this.featureType = featureType;
    this.value = value;
  }

  /** Creates a feature instance with a validated value. */
  static of(featureType: ProductFeatureType, value: unknown): ProductFeatureInstance {
    return new ProductFeatureInstance(featureType, value);
  }

  /** Creates a feature instance by parsing a string value. */
  static fromString(
    featureType: ProductFeatureType,
    stringValue: string,
  ): ProductFeatureInstance {
    const parsed = featureType.constraint.fromString(stringValue);
    return new ProductFeatureInstance(featureType, parsed);
  }

  /** String representation for persistence. */
  valueAsString(): string {
    return this.featureType.constraint.toString(this.value);
  }

  asString(): string {
    if (typeof this.value !== "string") {
      throw new Error(
        `Feature '${this.featureType.name}' value is not a string`,
      );
    }
    return this.value;
  }

  asInt(): number {
    if (typeof this.value !== "number" || !Number.isInteger(this.value)) {
      throw new Error(
        `Feature '${this.featureType.name}' value is not an integer`,
      );
    }
    return this.value;
  }

  asDecimal(): number {
    if (typeof this.value !== "number") {
      throw new Error(
        `Feature '${this.featureType.name}' value is not a number`,
      );
    }
    return this.value;
  }

  asDate(): string {
    if (typeof this.value !== "string") {
      throw new Error(
        `Feature '${this.featureType.name}' value is not a date string`,
      );
    }
    return this.value;
  }

  asBoolean(): boolean {
    if (typeof this.value !== "boolean") {
      throw new Error(
        `Feature '${this.featureType.name}' value is not a boolean`,
      );
    }
    return this.value;
  }

  toString(): string {
    return `${this.featureType.name}=${this.value}`;
  }
}

// ─── ProductFeatureInstances (Container) ──────────────────────────────────────

/**
 * Container for all feature values of a ProductInstance.
 *
 * WHY: Provides indexed lookup by feature name and validation against
 *      the ProductType's feature definitions (ensures all mandatory
 *      features have values, and no undefined features are provided).
 */
export class ProductFeatureInstances {
  private readonly features: ReadonlyMap<string, ProductFeatureInstance>;

  constructor(instances: ProductFeatureInstance[]) {
    const map = new Map<string, ProductFeatureInstance>();
    for (const inst of instances) {
      map.set(inst.featureType.name, inst);
    }
    this.features = map;
  }

  static empty(): ProductFeatureInstances {
    return new ProductFeatureInstances([]);
  }

  static of(...instances: ProductFeatureInstance[]): ProductFeatureInstances {
    return new ProductFeatureInstances(instances);
  }

  /** Returns the feature instance by name. */
  get(featureName: string): ProductFeatureInstance | undefined {
    return this.features.get(featureName);
  }

  /** Returns the feature instance by feature type. */
  getByType(featureType: ProductFeatureType): ProductFeatureInstance | undefined {
    return this.features.get(featureType.name);
  }

  /** Checks if a feature with the given name has a value. */
  has(featureName: string): boolean {
    return this.features.has(featureName);
  }

  /** Checks if a feature type has a value. */
  hasType(featureType: ProductFeatureType): boolean {
    return this.features.has(featureType.name);
  }

  /** Returns all feature instances. */
  all(): ProductFeatureInstance[] {
    return [...this.features.values()];
  }

  get size(): number {
    return this.features.size;
  }

  get isEmpty(): boolean {
    return this.features.size === 0;
  }

  /**
   * Validates that:
   * 1. All mandatory features from ProductType have values
   * 2. No undefined features are provided
   */
  validateAgainst(featureTypes: ProductFeatureTypes): void {
    for (const mandatory of featureTypes.mandatoryFeatures()) {
      checkArgument(
        this.has(mandatory.name),
        `Mandatory feature '${mandatory.name}' is missing`,
      );
    }
    for (const featureName of this.features.keys()) {
      checkArgument(
        featureTypes.has(featureName),
        `Feature '${featureName}' is not defined in ProductType`,
      );
    }
  }

  toString(): string {
    const entries = [...this.features.values()]
      .map((f) => `${f.featureType.name}=${f.value}`)
      .join(", ");
    return `ProductFeatureInstances{${entries}}`;
  }
}
