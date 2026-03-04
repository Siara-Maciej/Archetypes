// ─── Product Archetype — Abstract Layer ───────────────────────────────────────
//
// These abstract classes/interfaces mirror the Product Archetype pattern
// from src/product/ (the TypeScript reference implementation).
//
// Domain models in bounded contexts EXTEND these abstractions:
//   Tier            extends ProductType      (product-catalog)
//   BankOffer       extends CatalogEntry     (product-catalog)
//   CreditAgreement extends ProductInstance  (credit-agreement)
//

export type { Product } from './product';
export { ProductType } from './product-type';
export { CatalogEntry } from './catalog-entry';
export { ProductInstance } from './product-instance';

export { ProductMetadata } from './product-metadata';
export { Validity } from './validity';

export {
  ApplicabilityConstraint,
  ApplicabilityContext,
  isSatisfiedBy,
} from './applicability-constraint';

export {
  FeatureValueType,
  isInstanceOf,
} from './feature-value-constraint';
export type { FeatureValueConstraint } from './feature-value-constraint';
export {
  AllowedValuesConstraint,
  NumericRangeConstraint,
  DecimalRangeConstraint,
  UnconstrainedConstraint,
} from './feature-value-constraint';

export {
  ProductFeatureType,
  ProductFeatureTypeDefinition,
  ProductFeatureTypes,
  ProductFeatureInstance,
  ProductFeatureInstances,
} from './product-feature';
