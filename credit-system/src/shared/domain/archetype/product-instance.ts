/**
 * ProductInstance — abstract base for concrete exemplars of a ProductType.
 *
 * ProductType defines the template (e.g., "Credit Tier Premium 5-15k PLN").
 * ProductInstance is the actual signed contract with agreement number AGR/2024/001,
 * frozen financial parameters, and a lifecycle (ACTIVE → COMPLETED/DEFAULTED).
 *
 * Banking domain: CreditAgreement extends ProductInstance
 *   - agreementNumber is the serial/tracking identifier
 *   - financial parameters are frozen at signing
 *   - status lifecycle tracks the agreement state
 */

import type { ProductFeatureInstances } from './product-feature';

export abstract class ProductInstance {
  abstract readonly id: { readonly value: string };

  /** Reference back to the ProductType this instance was created from. */
  abstract readonly productTypeId: string;

  /** Concrete feature values chosen for this instance. */
  abstract readonly features: ProductFeatureInstances;
}
