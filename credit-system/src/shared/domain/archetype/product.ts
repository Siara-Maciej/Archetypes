/**
 * Product — the root interface of the Product Archetype.
 *
 * Every product in any domain (retail, banking, insurance, telecom) shares
 * these essential attributes. This is the TYPE level — a template, not a
 * concrete item.
 *
 * KEY INSIGHT:
 *   Product  → defines WHAT something IS (business definition)
 *   CatalogEntry → defines it's FOR SALE (commercial availability)
 *   ProductInstance → represents WHAT WAS DELIVERED (concrete item)
 *
 * Banking domain mapping:
 *   Tier            implements ProductType   (a credit product definition)
 *   BankOffer       implements CatalogEntry  (a commercial offering)
 *   CreditAgreement implements ProductInstance (a signed contract)
 */

import type { ProductMetadata } from './product-metadata';
import type { ApplicabilityConstraint } from './applicability-constraint';

export interface Product {
  /** Unique identifier — could be UUID, ISBN, GTIN, or domain-specific. */
  readonly id: { readonly value: string };
  /** Human-readable name. */
  readonly name: string;
  /** What the product is. */
  readonly description: string;
  /** Flexible key-value attributes. */
  readonly metadata: ProductMetadata | Record<string, string>;
  /** When/where this product is applicable (Specification Pattern). */
  readonly applicabilityConstraint: ApplicabilityConstraint;
}
