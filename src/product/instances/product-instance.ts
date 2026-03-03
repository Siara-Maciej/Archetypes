/**
 * ProductInstance — a concrete exemplar of a ProductType.
 *
 * WHY: ProductType defines the template (e.g., "iPhone 15 Pro 256GB").
 *      ProductInstance is the actual phone with serial number ABC123,
 *      from batch LOT-2024-001, in color "silver".
 *
 * VALIDATION at construction:
 *   1. Tracking requirements — the tracking strategy determines what identifiers
 *      are required (serial number, batch ID, both, or neither for IDENTICAL).
 *   2. Feature completeness — all mandatory features must have values,
 *      and no undefined features may be provided.
 *   3. Quantity unit — if quantity is specified, its unit must match
 *      the ProductType's preferred unit.
 */

import { checkArgument } from "../shared/preconditions";
import { ProductTrackingStrategy, isTrackedIndividually, isTrackedByBatch, requiresBothTrackingMethods, isInterchangeable } from "../value-objects/product-tracking-strategy";
import { Quantity } from "../value-objects/quantity";
import { ProductType } from "../domain/product-type";
import { Product } from "../domain/product";
import { ProductFeatureInstances } from "../features/product-feature-instance";
import { SerialNumber } from "./serial-number";
import { Instance, InstanceId, BatchId } from "./instance";

export class ProductInstance implements Instance {
  readonly id: InstanceId;
  readonly product: Product;
  readonly productType: ProductType;
  readonly serialNumber: SerialNumber | undefined;
  readonly batchId: BatchId | undefined;
  readonly quantity: Quantity | undefined;
  readonly features: ProductFeatureInstances;

  constructor(
    id: InstanceId,
    productType: ProductType,
    serialNumber: SerialNumber | undefined,
    batchId: BatchId | undefined,
    quantity: Quantity | undefined,
    features: ProductFeatureInstances,
  ) {
    checkArgument(id != null, "InstanceId must be defined");
    checkArgument(productType != null, "ProductType must be defined");
    checkArgument(features != null, "ProductFeatureInstances must be defined");

    validateTracking(productType, serialNumber, batchId);
    if (quantity != null) {
      checkArgument(
        quantity.unit.equals(productType.preferredUnit),
        "Quantity unit must match ProductType's preferred unit",
      );
    }
    features.validateAgainst(productType.featureTypes);

    this.id = id;
    this.product = productType;
    this.productType = productType;
    this.serialNumber = serialNumber;
    this.batchId = batchId;
    this.quantity = quantity;
    this.features = features;
  }

  toString(): string {
    return `ProductInstance{id=${this.id}, type=${this.productType.name}, serial=${this.serialNumber?.value ?? "none"}}`;
  }
}

function validateTracking(
  productType: ProductType,
  serialNumber: SerialNumber | undefined,
  batchId: BatchId | undefined,
): void {
  const strategy = productType.trackingStrategy;

  if (isInterchangeable(strategy)) {
    checkArgument(
      serialNumber == null && batchId == null,
      "IDENTICAL products must not have SerialNumber or BatchId",
    );
    return;
  }

  checkArgument(
    serialNumber != null || batchId != null,
    `ProductInstance must have either SerialNumber or BatchId for strategy: ${strategy}`,
  );

  if (isTrackedIndividually(strategy)) {
    checkArgument(
      serialNumber != null,
      `ProductType requires individual tracking (strategy: ${strategy}) but no serial number defined`,
    );
  }

  if (isTrackedByBatch(strategy)) {
    checkArgument(
      batchId != null,
      `ProductType requires batch tracking (strategy: ${strategy}) but no batch id defined`,
    );
  }

  if (requiresBothTrackingMethods(strategy)) {
    checkArgument(
      serialNumber != null && batchId != null,
      `ProductType requires both individual and batch tracking (strategy: ${strategy})`,
    );
  }
}
