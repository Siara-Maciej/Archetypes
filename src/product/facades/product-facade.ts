/**
 * ProductFacade — the main application service for managing ProductTypes.
 *
 * WHY: The domain layer (ProductType, features, constraints) is rich and complex.
 *      External consumers (API controllers, CLI, other services) shouldn't need to
 *      understand its internals. The facade provides a simplified API that:
 *      1. Accepts commands with primitive types (strings, numbers)
 *      2. Converts them to domain objects internally
 *      3. Returns views (DTOs) with primitive types
 *      4. Wraps failures in Result instead of throwing exceptions
 *
 * WHAT: Two operations:
 *   handle(DefineProductType) — creates a new ProductType from API input
 *   findBy(criteria)          — queries ProductTypes and returns views
 */

import { Result } from "../shared/result";
import { parseProductIdentifier, ProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductMetadata } from "../value-objects/product-metadata";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { Unit } from "../value-objects/quantity";
import { FeatureValueType } from "../features/feature-value-type";
import {
  FeatureValueConstraint,
  AllowedValuesConstraint,
  NumericRangeConstraint,
  DecimalRangeConstraint,
  RegexConstraint,
  DateRangeConstraint,
  UnconstrainedConstraint,
} from "../features/feature-value-constraint";
import { ProductFeatureType } from "../features/product-feature-type";
import { ProductBuilder } from "../domain/product-builder";
import { ProductType } from "../domain/product-type";
import { ProductTypeRepository } from "../repositories/repositories";
import {
  DefineProductType,
  FeatureConstraintConfig,
} from "../cqrs/commands";
import {
  FindProductTypeCriteria,
  FindByTrackingStrategyCriteria,
} from "../cqrs/queries";
import { ProductTypeView, FeatureTypeView } from "../cqrs/views";

export class ProductFacade {
  constructor(private readonly repository: ProductTypeRepository) {}

  /** Defines a new ProductType in the system. */
  handleDefineProductType(
    command: DefineProductType,
  ): Result<string, ProductIdentifier> {
    try {
      const productId = parseProductIdentifier(command.productIdType, command.productId);
      const name = new ProductName(command.name);
      const description = new ProductDescription(command.description);
      const unit = Unit.fromSymbol(command.unit);
      const trackingStrategy = command.trackingStrategy.toUpperCase() as ProductTrackingStrategy;

      const builder = new ProductBuilder(productId, name, description);
      if (command.metadata) {
        builder.withMetadataObject(ProductMetadata.of(command.metadata));
      }

      const typeBuilder = builder.asProductType(unit, trackingStrategy);

      if (command.mandatoryFeatures) {
        for (const f of command.mandatoryFeatures) {
          typeBuilder.withMandatoryFeature(
            ProductFeatureType.of(f.name, toConstraint(f.constraint)),
          );
        }
      }
      if (command.optionalFeatures) {
        for (const f of command.optionalFeatures) {
          typeBuilder.withOptionalFeature(
            ProductFeatureType.of(f.name, toConstraint(f.constraint)),
          );
        }
      }

      const productType = typeBuilder.build();
      this.repository.save(productType);
      return Result.success(productId);
    } catch (e) {
      return Result.failure(String((e as Error).message));
    }
  }

  /** Finds a ProductType by its identifier. */
  findByProductId(
    criteria: FindProductTypeCriteria,
  ): ProductTypeView | undefined {
    const pt = this.repository.findByIdValue(criteria.productId);
    return pt ? toProductTypeView(pt) : undefined;
  }

  /** Finds ProductTypes by tracking strategy. */
  findByTrackingStrategy(
    criteria: FindByTrackingStrategyCriteria,
  ): ProductTypeView[] {
    const strategy = criteria.trackingStrategy.toUpperCase() as ProductTrackingStrategy;
    return this.repository
      .findByTrackingStrategy(strategy)
      .map(toProductTypeView);
  }
}

// ─── Internal Converters ──────────────────────────────────────────────────────

function toConstraint(config: FeatureConstraintConfig): FeatureValueConstraint {
  switch (config.kind) {
    case "allowedValues":
      return AllowedValuesConstraint.of(...config.allowedValues);
    case "numericRange":
      return NumericRangeConstraint.between(config.min, config.max);
    case "decimalRange":
      return DecimalRangeConstraint.of(config.min, config.max);
    case "regex":
      return RegexConstraint.of(config.pattern);
    case "dateRange":
      return DateRangeConstraint.between(config.from, config.to);
    case "unconstrained":
      return new UnconstrainedConstraint(
        config.valueType.toUpperCase() as FeatureValueType,
      );
  }
}

function toProductTypeView(pt: ProductType): ProductTypeView {
  return {
    productId: pt.id.value,
    name: pt.name.value,
    description: pt.description.value,
    unit: pt.preferredUnit.symbol,
    trackingStrategy: pt.trackingStrategy,
    mandatoryFeatures: pt.featureTypes.mandatoryFeatures().map(toFeatureTypeView),
    optionalFeatures: pt.featureTypes.optionalFeatures().map(toFeatureTypeView),
  };
}

function toFeatureTypeView(ft: ProductFeatureType): FeatureTypeView {
  const c = ft.constraint;
  return {
    name: ft.name,
    valueType: c.valueType,
    constraintType: c.constraintType,
    constraintConfig: constraintConfigToMap(c),
    constraintDescription: c.desc(),
  };
}

function constraintConfigToMap(c: FeatureValueConstraint): Record<string, unknown> {
  if (c instanceof AllowedValuesConstraint)
    return { allowedValues: [...c.allowedValues] };
  if (c instanceof NumericRangeConstraint)
    return { min: c.min, max: c.max };
  if (c instanceof DecimalRangeConstraint)
    return { min: c.min, max: c.max };
  if (c instanceof RegexConstraint) return { pattern: c.patternString };
  if (c instanceof DateRangeConstraint)
    return { from: c.from, to: c.to };
  return {};
}
