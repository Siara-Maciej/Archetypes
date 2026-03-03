/**
 * PackageInstance — a concrete exemplar of a PackageType with delivered items.
 *
 * WHY: PackageType defines the structure (e.g., "Laptop Bundle" with choices).
 *      PackageInstance records WHAT WAS ACTUALLY DELIVERED — the specific laptop
 *      with serial ABC123, the specific RAM stick from batch LOT-001, etc.
 *
 * WHAT: Combines:
 *   - The PackageType that was purchased
 *   - The SelectedInstances: concrete instances chosen by the customer
 *   - Tracking info for the package itself (serial/batch)
 *
 * VALIDATION at construction:
 *   1. Tracking requirements (serial/batch must match strategy)
 *   2. Selection must satisfy all package structure rules
 */

import { checkArgument } from "../shared/preconditions";
import {
  isTrackedIndividually,
  isTrackedByBatch,
  requiresBothTrackingMethods,
} from "../value-objects/product-tracking-strategy";
import { ProductIdentifier } from "../value-objects/product-identifier";
import { PackageType } from "../domain/package-type";
import { Product } from "../domain/product";
import { SelectedProduct } from "../selection/selection-rule";
import { SerialNumber } from "./serial-number";
import { Instance, InstanceId, BatchId } from "./instance";

// ─── SelectedInstance ─────────────────────────────────────────────────────────

/**
 * A concrete instance (ProductInstance or PackageInstance) that was delivered
 * as part of a package.
 *
 * Example: Customer ordered "Laptop Bundle" and received:
 *   SelectedInstance(laptopInstance with serial ABC123, quantity=1)
 *   SelectedInstance(ramInstance from batch LOT-2025, quantity=1)
 */
export class SelectedInstance {
  readonly instance: Instance;
  readonly quantity: number;

  constructor(instance: Instance, quantity: number) {
    checkArgument(instance != null, "Instance must be defined");
    checkArgument(quantity > 0, "Quantity must be > 0");
    this.instance = instance;
    this.quantity = quantity;
  }

  get product(): Product {
    return this.instance.product;
  }

  get productId(): ProductIdentifier {
    return this.instance.product.id;
  }

  get instanceId(): InstanceId {
    return this.instance.id;
  }

  /** Converts to SelectedProduct for package validation. */
  toSelectedProduct(): SelectedProduct {
    return new SelectedProduct(this.instance.product.id, this.quantity);
  }
}

// ─── PackageInstance ──────────────────────────────────────────────────────────

export class PackageInstance implements Instance {
  readonly id: InstanceId;
  readonly product: Product;
  readonly packageType: PackageType;
  readonly selection: readonly SelectedInstance[];
  readonly serialNumber: SerialNumber | undefined;
  readonly batchId: BatchId | undefined;

  constructor(
    id: InstanceId,
    packageType: PackageType,
    selection: SelectedInstance[],
    serialNumber: SerialNumber | undefined,
    batchId: BatchId | undefined,
  ) {
    checkArgument(id != null, "InstanceId must be defined");
    checkArgument(packageType != null, "PackageType must be defined");
    checkArgument(
      selection != null && selection.length > 0,
      "Selection cannot be empty",
    );

    validatePackageTracking(packageType, serialNumber, batchId);
    validatePackageSelection(packageType, selection);

    this.id = id;
    this.product = packageType;
    this.packageType = packageType;
    this.selection = [...selection];
    this.serialNumber = serialNumber;
    this.batchId = batchId;
  }

  toString(): string {
    return `PackageInstance{id=${this.id}, type=${this.packageType.name}, selection=${this.selection.length} products}`;
  }
}

function validatePackageTracking(
  packageType: PackageType,
  serialNumber: SerialNumber | undefined,
  batchId: BatchId | undefined,
): void {
  checkArgument(
    serialNumber != null || batchId != null,
    "PackageInstance must have either SerialNumber or BatchId (or both)",
  );

  const strategy = packageType.trackingStrategy;
  if (isTrackedIndividually(strategy) && serialNumber == null) {
    throw new Error(
      `PackageType requires individual tracking (strategy: ${strategy}) but no serial number defined`,
    );
  }
  if (isTrackedByBatch(strategy) && batchId == null) {
    throw new Error(
      `PackageType requires batch tracking (strategy: ${strategy}) but no batch id defined`,
    );
  }
  if (requiresBothTrackingMethods(strategy) && (serialNumber == null || batchId == null)) {
    throw new Error(
      `PackageType requires both individual and batch tracking (strategy: ${strategy})`,
    );
  }
}

function validatePackageSelection(
  packageType: PackageType,
  selection: SelectedInstance[],
): void {
  const selectedProducts = selection.map((s) => s.toSelectedProduct());
  const result = packageType.validateSelection(selectedProducts);
  if (!result.isValid) {
    throw new Error(
      `Invalid package selection: ${result.errors.join(", ")}`,
    );
  }
}
