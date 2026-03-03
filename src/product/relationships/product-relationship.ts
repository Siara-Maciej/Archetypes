/**
 * ProductRelationship — directed relationships between products.
 *
 * WHY: Products don't exist in isolation. A phone can be UPGRADED TO a newer model,
 *      SUBSTITUTED BY an equivalent, COMPLEMENTED BY accessories, or declared
 *      INCOMPATIBLE WITH certain items. These relationships drive business rules
 *      like recommendations, compatibility checks, and migration paths.
 *
 * WHAT: All relationships are ASYMMETRIC (directed): from → to.
 *   UPGRADABLE_TO    — can upgrade to target product
 *   SUBSTITUTED_BY   — can be substituted by target product
 *   REPLACED_BY      — has been superseded by target product
 *   COMPLEMENTED_BY  — goes well with target product (accessories, add-ons)
 *   COMPATIBLE_WITH   — works with target product
 *   INCOMPATIBLE_WITH — conflicts with target product
 *
 * POLICIES: ProductRelationshipDefiningPolicy controls which relationships
 *           are allowed (e.g., no self-relationships, no seasonal/non-seasonal
 *           compatibility mismatch).
 */

import { randomUUID } from "crypto";
import { ProductIdentifier } from "../value-objects/product-identifier";

// ─── ProductRelationshipType ──────────────────────────────────────────────────

export enum ProductRelationshipType {
  UPGRADABLE_TO = "UPGRADABLE_TO",
  SUBSTITUTED_BY = "SUBSTITUTED_BY",
  REPLACED_BY = "REPLACED_BY",
  COMPLEMENTED_BY = "COMPLEMENTED_BY",
  COMPATIBLE_WITH = "COMPATIBLE_WITH",
  INCOMPATIBLE_WITH = "INCOMPATIBLE_WITH",
}

// ─── ProductRelationshipId ────────────────────────────────────────────────────

export class ProductRelationshipId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static of(value: string): ProductRelationshipId {
    return new ProductRelationshipId(value);
  }

  static random(): ProductRelationshipId {
    return new ProductRelationshipId(randomUUID());
  }

  toString(): string {
    return this.value;
  }
}

// ─── ProductRelationship ──────────────────────────────────────────────────────

export interface ProductRelationship {
  readonly id: ProductRelationshipId;
  readonly from: ProductIdentifier;
  readonly to: ProductIdentifier;
  readonly type: ProductRelationshipType;
}

export function createProductRelationship(
  id: ProductRelationshipId,
  from: ProductIdentifier,
  to: ProductIdentifier,
  type: ProductRelationshipType,
): ProductRelationship {
  return { id, from, to, type };
}

// ─── ProductRelationshipDefiningPolicy ────────────────────────────────────────

/**
 * Policy that controls which product relationships are allowed.
 * Implement custom policies for domain-specific rules.
 */
export interface ProductRelationshipDefiningPolicy {
  canDefineFor(
    from: ProductIdentifier,
    to: ProductIdentifier,
    type: ProductRelationshipType,
  ): boolean;
}

/** Default policy — allows all relationships. */
export class AlwaysAllowPolicy implements ProductRelationshipDefiningPolicy {
  canDefineFor(): boolean {
    return true;
  }
}
