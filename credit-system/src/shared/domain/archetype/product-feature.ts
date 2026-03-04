/**
 * ProductFeatureType — defines a configurable characteristic of a product.
 *
 * Instead of creating subclasses for every product variation,
 * define feature types and assign values at instance creation time.
 *
 * ProductFeatureInstance — a concrete, validated value for a feature.
 */

import { FeatureValueConstraint, AllowedValuesConstraint, NumericRangeConstraint, DecimalRangeConstraint, UnconstrainedConstraint, FeatureValueType } from './feature-value-constraint';

// ─── ProductFeatureType ───────────────────────────────────────────────────────

export class ProductFeatureType {
  readonly name: string;
  readonly constraint: FeatureValueConstraint;

  constructor(name: string, constraint: FeatureValueConstraint) {
    if (!name || name.trim().length === 0) {
      throw new Error('Feature type name must be defined');
    }
    this.name = name;
    this.constraint = constraint;
  }

  static withAllowedValues(name: string, ...values: string[]): ProductFeatureType {
    return new ProductFeatureType(name, AllowedValuesConstraint.of(...values));
  }

  static withNumericRange(name: string, min: number, max: number): ProductFeatureType {
    return new ProductFeatureType(name, NumericRangeConstraint.between(min, max));
  }

  static withDecimalRange(name: string, min: number, max: number): ProductFeatureType {
    return new ProductFeatureType(name, DecimalRangeConstraint.between(min, max));
  }

  static unconstrained(name: string, valueType: FeatureValueType): ProductFeatureType {
    return new ProductFeatureType(name, new UnconstrainedConstraint(valueType));
  }

  isValidValue(value: unknown): boolean {
    return this.constraint.isValid(value);
  }

  validateValue(value: unknown): void {
    if (value == null) throw new Error('Feature value must not be null');
    if (!this.constraint.isValid(value)) {
      throw new Error(
        `Invalid value '${value}' for feature '${this.name}'. Expected: ${this.constraint.desc()}`,
      );
    }
  }
}

// ─── ProductFeatureTypeDefinition ─────────────────────────────────────────────

export class ProductFeatureTypeDefinition {
  readonly featureType: ProductFeatureType;
  readonly mandatory: boolean;

  constructor(featureType: ProductFeatureType, mandatory: boolean) {
    this.featureType = featureType;
    this.mandatory = mandatory;
  }

  static mandatoryOf(featureType: ProductFeatureType): ProductFeatureTypeDefinition {
    return new ProductFeatureTypeDefinition(featureType, true);
  }

  static optionalOf(featureType: ProductFeatureType): ProductFeatureTypeDefinition {
    return new ProductFeatureTypeDefinition(featureType, false);
  }
}

// ─── ProductFeatureTypes (Container) ──────────────────────────────────────────

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

  get(featureName: string): ProductFeatureTypeDefinition | undefined {
    return this.features.get(featureName);
  }

  has(featureName: string): boolean {
    return this.features.has(featureName);
  }

  isMandatory(featureName: string): boolean {
    return this.features.get(featureName)?.mandatory ?? false;
  }

  mandatoryFeatures(): ProductFeatureType[] {
    return [...this.features.values()]
      .filter((d) => d.mandatory)
      .map((d) => d.featureType);
  }

  optionalFeatures(): ProductFeatureType[] {
    return [...this.features.values()]
      .filter((d) => !d.mandatory)
      .map((d) => d.featureType);
  }

  allFeatures(): ProductFeatureType[] {
    return [...this.features.values()].map((d) => d.featureType);
  }

  get size(): number {
    return this.features.size;
  }

  get isEmpty(): boolean {
    return this.features.size === 0;
  }
}

// ─── ProductFeatureInstance ───────────────────────────────────────────────────

export class ProductFeatureInstance {
  readonly featureType: ProductFeatureType;
  readonly value: unknown;

  constructor(featureType: ProductFeatureType, value: unknown) {
    featureType.validateValue(value);
    this.featureType = featureType;
    this.value = value;
  }

  static of(featureType: ProductFeatureType, value: unknown): ProductFeatureInstance {
    return new ProductFeatureInstance(featureType, value);
  }

  asString(): string {
    if (typeof this.value !== 'string') {
      throw new Error(`Feature '${this.featureType.name}' value is not a string`);
    }
    return this.value;
  }

  asNumber(): number {
    if (typeof this.value !== 'number') {
      throw new Error(`Feature '${this.featureType.name}' value is not a number`);
    }
    return this.value;
  }

  asBoolean(): boolean {
    if (typeof this.value !== 'boolean') {
      throw new Error(`Feature '${this.featureType.name}' value is not a boolean`);
    }
    return this.value;
  }
}

// ─── ProductFeatureInstances (Container) ──────────────────────────────────────

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

  get(featureName: string): ProductFeatureInstance | undefined {
    return this.features.get(featureName);
  }

  has(featureName: string): boolean {
    return this.features.has(featureName);
  }

  all(): ProductFeatureInstance[] {
    return [...this.features.values()];
  }

  get size(): number {
    return this.features.size;
  }

  validateAgainst(featureTypes: ProductFeatureTypes): void {
    for (const mandatory of featureTypes.mandatoryFeatures()) {
      if (!this.has(mandatory.name)) {
        throw new Error(`Mandatory feature '${mandatory.name}' is missing`);
      }
    }
    for (const featureName of this.features.keys()) {
      if (!featureTypes.has(featureName)) {
        throw new Error(`Feature '${featureName}' is not defined in ProductType`);
      }
    }
  }
}
