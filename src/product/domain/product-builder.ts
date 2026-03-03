/**
 * ProductBuilder — fluent builder for creating ProductType and PackageType.
 *
 * WHY: Product creation involves many parameters, both required and optional.
 *      A builder provides a readable, step-by-step construction API that
 *      guides the developer through the process and prevents invalid states.
 *
 * HOW: Two-phase building pattern:
 *   Phase 1 — Common attributes (id, name, description, metadata, applicability)
 *   Phase 2 — Type-specific attributes via specialized inner builders:
 *     - asProductType() → ProductTypeBuilder (features, unit, tracking)
 *     - asPackageType() → PackageTypeBuilder (product sets, selection rules)
 *
 * USAGE:
 *   // ProductType
 *   const laptop = new ProductBuilder(id, name, description)
 *     .withMetadata("category", "electronics")
 *     .asProductType(Unit.pieces(), ProductTrackingStrategy.INDIVIDUALLY_TRACKED)
 *     .withMandatoryFeature(colorFeature)
 *     .build();
 *
 *   // PackageType
 *   const bundle = new ProductBuilder(id, name, description)
 *     .asPackageType()
 *     .withSingleChoice("Memory", ram8GB.id, ram16GB.id)
 *     .withOptionalChoice("Accessories", mouse.id, bag.id)
 *     .build();
 */

import { ProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductMetadata } from "../value-objects/product-metadata";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { Unit } from "../value-objects/quantity";
import {
  ProductFeatureType,
  ProductFeatureTypeDefinition,
  ProductFeatureTypes,
} from "../features/product-feature-type";
import { ApplicabilityConstraint } from "../constraints/applicability-constraint";
import { ProductSet, SelectionRule } from "../selection/selection-rule";
import { ProductType } from "./product-type";
import { PackageType, PackageStructure } from "./package-type";

export class ProductBuilder {
  private readonly id: ProductIdentifier;
  private readonly name: ProductName;
  private readonly description: ProductDescription;
  private metadata: ProductMetadata = ProductMetadata.empty();
  private applicabilityConstraint: ApplicabilityConstraint =
    ApplicabilityConstraint.alwaysTrue();

  constructor(
    id: ProductIdentifier,
    name: ProductName,
    description: ProductDescription,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  withMetadataObject(metadata: ProductMetadata): ProductBuilder {
    this.metadata = metadata;
    return this;
  }

  withMetadata(key: string, value: string): ProductBuilder {
    this.metadata = this.metadata.with(key, value);
    return this;
  }

  withApplicabilityConstraint(
    constraint: ApplicabilityConstraint,
  ): ProductBuilder {
    this.applicabilityConstraint = constraint;
    return this;
  }

  /** Starts building a ProductType (regular product). */
  asProductType(
    preferredUnit: Unit,
    trackingStrategy: ProductTrackingStrategy,
  ): ProductTypeBuilder {
    return new ProductTypeBuilder(this, preferredUnit, trackingStrategy);
  }

  /** Starts building a PackageType (bundle of products). */
  asPackageType(): PackageTypeBuilder {
    return new PackageTypeBuilder(this);
  }

  // Accessors for inner builders
  /** @internal */ getId(): ProductIdentifier { return this.id; }
  /** @internal */ getName(): ProductName { return this.name; }
  /** @internal */ getDescription(): ProductDescription { return this.description; }
  /** @internal */ getMetadata(): ProductMetadata { return this.metadata; }
  /** @internal */ setMetadata(m: ProductMetadata): void { this.metadata = m; }
  /** @internal */ getApplicabilityConstraint(): ApplicabilityConstraint { return this.applicabilityConstraint; }
  /** @internal */ setApplicabilityConstraint(c: ApplicabilityConstraint): void { this.applicabilityConstraint = c; }
}

// ─── ProductTypeBuilder ───────────────────────────────────────────────────────

export class ProductTypeBuilder {
  private readonly parent: ProductBuilder;
  private readonly preferredUnit: Unit;
  private readonly trackingStrategy: ProductTrackingStrategy;
  private readonly featureDefinitions: ProductFeatureTypeDefinition[] = [];

  constructor(
    parent: ProductBuilder,
    preferredUnit: Unit,
    trackingStrategy: ProductTrackingStrategy,
  ) {
    this.parent = parent;
    this.preferredUnit = preferredUnit;
    this.trackingStrategy = trackingStrategy;
  }

  withMandatoryFeature(featureType: ProductFeatureType): ProductTypeBuilder {
    this.featureDefinitions.push(
      ProductFeatureTypeDefinition.mandatoryOf(featureType),
    );
    return this;
  }

  withOptionalFeature(featureType: ProductFeatureType): ProductTypeBuilder {
    this.featureDefinitions.push(
      ProductFeatureTypeDefinition.optionalOf(featureType),
    );
    return this;
  }

  withFeature(definition: ProductFeatureTypeDefinition): ProductTypeBuilder {
    this.featureDefinitions.push(definition);
    return this;
  }

  withApplicabilityConstraint(
    constraint: ApplicabilityConstraint,
  ): ProductTypeBuilder {
    this.parent.setApplicabilityConstraint(constraint);
    return this;
  }

  withMetadataObject(metadata: ProductMetadata): ProductTypeBuilder {
    this.parent.setMetadata(metadata);
    return this;
  }

  withMetadata(key: string, value: string): ProductTypeBuilder {
    this.parent.setMetadata(this.parent.getMetadata().with(key, value));
    return this;
  }

  build(): ProductType {
    return new ProductType(
      this.parent.getId(),
      this.parent.getName(),
      this.parent.getDescription(),
      this.preferredUnit,
      this.trackingStrategy,
      new ProductFeatureTypes(this.featureDefinitions),
      this.parent.getMetadata(),
      this.parent.getApplicabilityConstraint(),
    );
  }
}

// ─── PackageTypeBuilder ───────────────────────────────────────────────────────

export class PackageTypeBuilder {
  private readonly parent: ProductBuilder;
  private readonly productSets = new Map<string, ProductSet>();
  private readonly selectionRules: SelectionRule[] = [];
  private trackingStrategy: ProductTrackingStrategy =
    ProductTrackingStrategy.INDIVIDUALLY_TRACKED;

  constructor(parent: ProductBuilder) {
    this.parent = parent;
  }

  withTrackingStrategy(strategy: ProductTrackingStrategy): PackageTypeBuilder {
    this.trackingStrategy = strategy;
    return this;
  }

  /** Exactly 1 from the set (required single choice). */
  withSingleChoice(
    setName: string,
    ...productIds: ProductIdentifier[]
  ): PackageTypeBuilder {
    return this.withChoice(setName, 1, 1, ...productIds);
  }

  /** 0 or 1 from the set (optional choice). */
  withOptionalChoice(
    setName: string,
    ...productIds: ProductIdentifier[]
  ): PackageTypeBuilder {
    return this.withChoice(setName, 0, 1, ...productIds);
  }

  /** At least 1 from the set (required, any number). */
  withRequiredChoice(
    setName: string,
    ...productIds: ProductIdentifier[]
  ): PackageTypeBuilder {
    return this.withChoice(
      setName,
      1,
      Number.MAX_SAFE_INTEGER,
      ...productIds,
    );
  }

  /** Custom min/max selection rule. */
  withChoice(
    setName: string,
    min: number,
    max: number,
    ...productIds: ProductIdentifier[]
  ): PackageTypeBuilder {
    const set = new ProductSet(setName, productIds);
    this.productSets.set(setName, set);
    this.selectionRules.push(SelectionRule.isSubsetOf(set, min, max));
    return this;
  }

  withProductSet(set: ProductSet): PackageTypeBuilder {
    this.productSets.set(set.name, set);
    return this;
  }

  /** Adds a custom selection rule. */
  withRule(rule: SelectionRule): PackageTypeBuilder {
    this.selectionRules.push(rule);
    return this;
  }

  /** Returns the ProductSet by name (for building conditional rules). */
  getProductSet(setName: string): ProductSet | undefined {
    return this.productSets.get(setName);
  }

  withApplicabilityConstraint(
    constraint: ApplicabilityConstraint,
  ): PackageTypeBuilder {
    this.parent.setApplicabilityConstraint(constraint);
    return this;
  }

  withMetadataObject(metadata: ProductMetadata): PackageTypeBuilder {
    this.parent.setMetadata(metadata);
    return this;
  }

  withMetadata(key: string, value: string): PackageTypeBuilder {
    this.parent.setMetadata(this.parent.getMetadata().with(key, value));
    return this;
  }

  build(): PackageType {
    const structure = new PackageStructure(
      this.productSets,
      this.selectionRules,
    );
    return new PackageType(
      this.parent.getId(),
      this.parent.getName(),
      this.parent.getDescription(),
      this.trackingStrategy,
      this.parent.getMetadata(),
      this.parent.getApplicabilityConstraint(),
      structure,
    );
  }
}
