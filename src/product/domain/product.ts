/**
 * Product — the root interface of the Product Archetype (Composite Pattern).
 *
 * WHY: The "Product" concept is universal across industries — retail, telecom,
 *      banking, insurance. Every business sells SOMETHING. This archetype
 *      captures the essential structure that ALL products share, regardless
 *      of industry.
 *
 * WHAT: Product is a COMPOSITE PATTERN with two variants:
 *       - ProductType (LEAF)      — a single product (iPhone, book, milk)
 *       - PackageType (COMPOSITE) — a bundle of products (laptop + bag + mouse)
 *
 *      Every Product has:
 *       - id:          unique identifier (UUID, ISBN, GTIN)
 *       - name:        human-readable name
 *       - description: what the product is
 *       - metadata:    flexible key-value attributes
 *       - applicabilityConstraint: when/where the product is applicable
 *
 * WHY COMPOSITE: PackageType can contain other PackageTypes (nested bundles).
 *      A "Premium Office Package" might contain a "Hardware Bundle" (which is
 *      itself a package) plus a "Software Bundle" (also a package).
 *
 * KEY INSIGHT: Product defines WHAT something IS (the business definition).
 *              CatalogEntry defines that it's FOR SALE (commercial availability).
 *              ProductInstance represents WHAT WAS DELIVERED (concrete item).
 *
 * This is the TYPE level — a template, not a concrete item.
 */

import { ProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductMetadata } from "../value-objects/product-metadata";
import {
  ApplicabilityConstraint,
  ApplicabilityContext,
  isSatisfiedBy,
} from "../constraints/applicability-constraint";

export interface Product {
  readonly id: ProductIdentifier;
  readonly name: ProductName;
  readonly description: ProductDescription;
  readonly metadata: ProductMetadata;
  readonly applicabilityConstraint: ApplicabilityConstraint;
}

/** Checks if a product is applicable in the given context. */
export function isApplicableFor(
  product: Product,
  context: ApplicabilityContext,
): boolean {
  return isSatisfiedBy(product.applicabilityConstraint, context);
}
