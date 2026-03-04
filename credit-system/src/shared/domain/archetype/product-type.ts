/**
 * ProductType — abstract base for LEAF products in the Composite Pattern.
 *
 * A ProductType defines the full business definition of a product:
 *   - identity & naming
 *   - feature definitions (what can vary between instances)
 *   - metadata (flexible attributes)
 *   - applicability (where/when this product applies)
 *
 * FEATURES make the product CONFIGURABLE without subclassing.
 * Instead of creating CreditTierLow, CreditTierMedium, CreditTierHigh,
 * define ProductFeatureType("riskLevel", {low, medium, high}) and assign
 * concrete values when creating ProductInstance.
 *
 * Banking domain: Tier extends ProductType
 *   - interestRate, maxLoanToValue, etc. are domain-specific attributes
 *   - featureTypes define configurable aspects (insurance options, etc.)
 */

import type { Product } from './product';
import type { ProductFeatureTypes } from './product-feature';
import type { ProductMetadata } from './product-metadata';
import type { ApplicabilityConstraint } from './applicability-constraint';

export abstract class ProductType implements Product {
  abstract readonly id: { readonly value: string };
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly metadata: ProductMetadata | Record<string, string>;
  abstract readonly applicabilityConstraint: ApplicabilityConstraint;

  /** Feature type definitions — what can vary between instances. */
  abstract readonly featureTypes: ProductFeatureTypes;
}
