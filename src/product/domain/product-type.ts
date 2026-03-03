/**
 * ProductType — a LEAF in the Composite Pattern. A single, non-composite product.
 *
 * WHY: Most products are standalone items — an iPhone, a book, a bag of coffee.
 *      ProductType captures the full definition of such a product: its identity,
 *      name, how instances are tracked, what features can vary between instances,
 *      and when/where it's applicable.
 *
 * WHAT: ProductType defines:
 *   - identity & naming       (id, name, description)
 *   - measurement             (preferredUnit — pieces, kg, liters)
 *   - tracking strategy       (how instances are identified — serial, batch, both, none)
 *   - feature definitions     (what can vary — color, size, weight)
 *   - metadata                (flexible attributes — brand, category, seasonal)
 *   - applicability           (where/when this product applies)
 *
 * TRACKING STRATEGY is the key architectural decision:
 *   UNIQUE                  → one-of-a-kind (painting, vintage guitar)
 *   INDIVIDUALLY_TRACKED    → each has serial number (phones, contracts)
 *   BATCH_TRACKED           → tracked by batch (milk, pharmaceuticals)
 *   INDIVIDUALLY_AND_BATCH  → both (TVs — serial + batch for recalls)
 *   IDENTICAL               → interchangeable (screws, rice, flour)
 *
 * FEATURES make the product CONFIGURABLE without subclassing.
 *   Instead of creating iPhoneRed, iPhoneBlue, iPhoneSilver classes,
 *   we define ProductFeatureType("color", {red, blue, silver}) and assign
 *   concrete values when creating ProductInstance.
 *
 * This is the TYPE level — a template for creating ProductInstances.
 */

import { checkArgument } from "../shared/preconditions";
import { ProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductMetadata } from "../value-objects/product-metadata";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { Unit } from "../value-objects/quantity";
import { ProductFeatureTypes } from "../features/product-feature-type";
import {
  ApplicabilityConstraint,
} from "../constraints/applicability-constraint";
import { Product } from "./product";

export class ProductType implements Product {
  readonly id: ProductIdentifier;
  readonly name: ProductName;
  readonly description: ProductDescription;
  readonly preferredUnit: Unit;
  readonly trackingStrategy: ProductTrackingStrategy;
  readonly featureTypes: ProductFeatureTypes;
  readonly metadata: ProductMetadata;
  readonly applicabilityConstraint: ApplicabilityConstraint;

  constructor(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
    preferredUnit: Unit,
    trackingStrategy: ProductTrackingStrategy,
    featureTypes: ProductFeatureTypes,
    metadata: ProductMetadata,
    applicabilityConstraint: ApplicabilityConstraint,
  ) {
    checkArgument(id != null, "ProductIdentifier must be defined");
    checkArgument(name != null, "ProductName must be defined");
    checkArgument(description != null, "ProductDescription must be defined");
    checkArgument(preferredUnit != null, "Unit must be defined");
    checkArgument(trackingStrategy != null, "ProductTrackingStrategy must be defined");
    checkArgument(featureTypes != null, "ProductFeatureTypes must be defined");
    checkArgument(metadata != null, "ProductMetadata must be defined");
    checkArgument(applicabilityConstraint != null, "ApplicabilityConstraint must be defined");
    this.id = id;
    this.name = name;
    this.description = description;
    this.preferredUnit = preferredUnit;
    this.trackingStrategy = trackingStrategy;
    this.featureTypes = featureTypes;
    this.metadata = metadata;
    this.applicabilityConstraint = applicabilityConstraint;
  }

  /** Simple product for testing — IDENTICAL tracking, no features. */
  static define(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
  ): ProductType {
    return new ProductType(
      id, name, description,
      Unit.pieces(), ProductTrackingStrategy.IDENTICAL,
      ProductFeatureTypes.empty(), ProductMetadata.empty(),
      ApplicabilityConstraint.alwaysTrue(),
    );
  }

  /** One-of-a-kind product. */
  static unique(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
  ): ProductType {
    return new ProductType(
      id, name, description,
      Unit.pieces(), ProductTrackingStrategy.UNIQUE,
      ProductFeatureTypes.empty(), ProductMetadata.empty(),
      ApplicabilityConstraint.alwaysTrue(),
    );
  }

  /** Each instance tracked by serial number. */
  static individuallyTracked(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
    preferredUnit: Unit,
  ): ProductType {
    return new ProductType(
      id, name, description,
      preferredUnit, ProductTrackingStrategy.INDIVIDUALLY_TRACKED,
      ProductFeatureTypes.empty(), ProductMetadata.empty(),
      ApplicabilityConstraint.alwaysTrue(),
    );
  }

  /** Instances tracked by production batch. */
  static batchTracked(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
    preferredUnit: Unit,
  ): ProductType {
    return new ProductType(
      id, name, description,
      preferredUnit, ProductTrackingStrategy.BATCH_TRACKED,
      ProductFeatureTypes.empty(), ProductMetadata.empty(),
      ApplicabilityConstraint.alwaysTrue(),
    );
  }

  /** Interchangeable items. */
  static identical(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
    preferredUnit: Unit,
  ): ProductType {
    return new ProductType(
      id, name, description,
      preferredUnit, ProductTrackingStrategy.IDENTICAL,
      ProductFeatureTypes.empty(), ProductMetadata.empty(),
      ApplicabilityConstraint.alwaysTrue(),
    );
  }

  toString(): string {
    return `ProductType{id=${this.id.value}, name=${this.name}, tracking=${this.trackingStrategy}}`;
  }
}
