/**
 * PackageType — a COMPOSITE in the Composite Pattern. A bundle of products.
 *
 * WHY: Many products are sold as packages — a laptop bundle, a telecom plan,
 *      a banking package, an insurance combo. PackageType models these bundles
 *      with configurable selection rules that define what the customer can choose.
 *
 * WHAT: PackageType combines:
 *   - PackageStructure: defines available products (ProductSets) and selection rules
 *   - Standard Product attributes (id, name, description, metadata, etc.)
 *
 * STRUCTURE: Two layers of configuration:
 *   1. ProductSet — WHAT products are available ("menu items")
 *      Example: "Memory Options" = {4GB, 8GB, 16GB}
 *   2. SelectionRule — HOW MANY the customer must/can choose
 *      Example: "select exactly 1 Memory Option"
 *
 * NESTING: A PackageType can contain other PackageTypes:
 *   "Premium Office" = { "Hardware Bundle" (package) + "Software Bundle" (package) }
 *
 * VALIDATION: PackageType validates customer selections at instance creation time.
 *
 * PackageValidationResult — the outcome of validating a selection. Either success
 *   (all rules passed) or failure with a list of error messages.
 *
 * PackageStructure — defines WHAT products are available and HOW they can be combined.
 *   ProductSets are the "raw material" (ingredients); SelectionRules are the "recipe".
 */

import { checkArgument } from "../shared/preconditions";
import { ProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductMetadata } from "../value-objects/product-metadata";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { ApplicabilityConstraint } from "../constraints/applicability-constraint";
import {
  ProductSet,
  SelectedProduct,
  SelectionRule,
  isSelectionSatisfied,
} from "../selection/selection-rule";
import { Product } from "./product";

// ─── PackageValidationResult ──────────────────────────────────────────────────

export class PackageValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];

  private constructor(valid: boolean, errors: string[]) {
    this.valid = valid;
    this.errors = errors;
  }

  static success(): PackageValidationResult {
    return new PackageValidationResult(true, []);
  }

  static failure(errors: string[]): PackageValidationResult {
    return new PackageValidationResult(false, errors);
  }

  get isValid(): boolean {
    return this.valid;
  }
}

// ─── PackageStructure ─────────────────────────────────────────────────────────

export class PackageStructure {
  readonly productSets: ReadonlyMap<string, ProductSet>;
  readonly selectionRules: readonly SelectionRule[];

  constructor(
    productSets: Map<string, ProductSet>,
    selectionRules: SelectionRule[],
  ) {
    checkArgument(productSets.size > 0, "ProductSets must be defined");
    checkArgument(selectionRules.length > 0, "Selection rules must be defined");
    this.productSets = new Map(productSets);
    this.selectionRules = [...selectionRules];
  }

  /** Validates whether a customer's selection satisfies all package rules. */
  validate(selection: SelectedProduct[]): PackageValidationResult {
    const errors: string[] = [];
    for (let i = 0; i < this.selectionRules.length; i++) {
      const rule = this.selectionRules[i];
      if (!isSelectionSatisfied(rule, selection)) {
        errors.push(`Rule ${i + 1} not satisfied: ${JSON.stringify(rule)}`);
      }
    }
    return errors.length === 0
      ? PackageValidationResult.success()
      : PackageValidationResult.failure(errors);
  }

  toString(): string {
    return `PackageStructure{sets=${this.productSets.size}, rules=${this.selectionRules.length}}`;
  }
}

// ─── PackageType ──────────────────────────────────────────────────────────────

export class PackageType implements Product {
  readonly id: ProductIdentifier;
  readonly name: ProductName;
  readonly description: ProductDescription;
  readonly trackingStrategy: ProductTrackingStrategy;
  readonly metadata: ProductMetadata;
  readonly applicabilityConstraint: ApplicabilityConstraint;
  readonly structure: PackageStructure;

  constructor(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
    trackingStrategy: ProductTrackingStrategy,
    metadata: ProductMetadata,
    applicabilityConstraint: ApplicabilityConstraint,
    structure: PackageStructure,
  ) {
    checkArgument(id != null, "ProductIdentifier must be defined");
    checkArgument(name != null, "ProductName must be defined");
    checkArgument(description != null, "ProductDescription must be defined");
    checkArgument(trackingStrategy != null, "ProductTrackingStrategy must be defined");
    checkArgument(metadata != null, "ProductMetadata must be defined");
    checkArgument(applicabilityConstraint != null, "ApplicabilityConstraint must be defined");
    checkArgument(structure != null, "PackageStructure must be defined");
    this.id = id;
    this.name = name;
    this.description = description;
    this.trackingStrategy = trackingStrategy;
    this.metadata = metadata;
    this.applicabilityConstraint = applicabilityConstraint;
    this.structure = structure;
  }

  /** Validates if selected products match package structure rules. */
  validateSelection(selection: SelectedProduct[]): PackageValidationResult {
    return this.structure.validate(selection);
  }

  toString(): string {
    return `PackageType{id=${this.id.value}, name=${this.name}, structure=${this.structure}}`;
  }
}
