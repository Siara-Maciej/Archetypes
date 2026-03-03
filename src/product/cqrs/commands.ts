/**
 * Commands — write operations for the Product Archetype public API.
 *
 * WHY: Commands represent INTENT to change the system. They use only primitive
 *      types (strings, numbers) — no domain objects leak through the API boundary.
 *      This decouples the public API from internal domain changes.
 *
 * WHAT: Each command is a plain data object describing a desired mutation:
 *   DefineProductType   — create a new product type definition
 *   AddToOffer          — add a product to the commercial catalog
 *   DiscontinueProduct  — stop offering a product
 *   UpdateMetadata      — update catalog entry metadata
 *
 * CONSTRAINT CONFIGS: Feature constraints are described via config objects
 *   (AllowedValuesConfig, NumericRangeConfig, etc.) that map 1:1 to domain
 *   constraints but use only primitive types.
 */

// ─── Feature Constraint Configs ───────────────────────────────────────────────

export type FeatureConstraintConfig =
  | AllowedValuesConfig
  | NumericRangeConfig
  | DecimalRangeConfig
  | RegexConfig
  | DateRangeConfig
  | UnconstrainedConfig;

export interface AllowedValuesConfig {
  readonly kind: "allowedValues";
  readonly allowedValues: ReadonlySet<string>;
}

export interface NumericRangeConfig {
  readonly kind: "numericRange";
  readonly min: number;
  readonly max: number;
}

export interface DecimalRangeConfig {
  readonly kind: "decimalRange";
  readonly min: string;
  readonly max: string;
}

export interface RegexConfig {
  readonly kind: "regex";
  readonly pattern: string;
}

export interface DateRangeConfig {
  readonly kind: "dateRange";
  readonly from: string;
  readonly to: string;
}

export interface UnconstrainedConfig {
  readonly kind: "unconstrained";
  readonly valueType: string;
}

// ─── Feature Definitions ──────────────────────────────────────────────────────

export interface MandatoryFeature {
  readonly name: string;
  readonly constraint: FeatureConstraintConfig;
}

export interface OptionalFeature {
  readonly name: string;
  readonly constraint: FeatureConstraintConfig;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

export interface DefineProductType {
  readonly productIdType: string;
  readonly productId: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
  readonly trackingStrategy: string;
  readonly mandatoryFeatures?: MandatoryFeature[];
  readonly optionalFeatures?: OptionalFeature[];
  readonly metadata?: Record<string, string>;
}

export interface AddToOffer {
  readonly productTypeId: string;
  readonly displayName: string;
  readonly description: string;
  readonly categories?: Set<string>;
  readonly availableFrom?: string;
  readonly availableUntil?: string;
  readonly metadata?: Record<string, string>;
}

export interface DiscontinueProduct {
  readonly catalogEntryId: string;
  readonly discontinuationDate: string;
}

export interface UpdateMetadata {
  readonly catalogEntryId: string;
  readonly metadata: Record<string, string>;
}

export interface DefineRelationship {
  readonly fromProductId: string;
  readonly toProductId: string;
  readonly relationshipType: string;
}

export interface RemoveRelationship {
  readonly relationshipId: string;
}
