/**
 * InstanceBuilder — fluent builder for ProductInstance and PackageInstance.
 *
 * WHY: Same rationale as ProductBuilder — instance creation involves many
 *      parameters, optional fields, and validation. The builder provides
 *      a readable, guided construction API.
 *
 * USAGE:
 *   // ProductInstance
 *   const instance = new InstanceBuilder(InstanceId.newOne())
 *     .withSerial(SerialNumber.of("ABC123"))
 *     .asProductInstance(laptopType)
 *     .withFeature(colorFeature, "silver")
 *     .build();
 *
 *   // PackageInstance
 *   const pkg = new InstanceBuilder(InstanceId.newOne())
 *     .withSerial(SerialNumber.of("PKG-001"))
 *     .asPackageInstance(bundleType)
 *     .withSelection([selectedLaptop, selectedRam])
 *     .build();
 */

import { Quantity } from "../value-objects/quantity";
import { ProductType } from "../domain/product-type";
import { PackageType } from "../domain/package-type";
import { ProductFeatureType } from "../features/product-feature-type";
import {
  ProductFeatureInstance,
  ProductFeatureInstances,
} from "../features/product-feature-instance";
import { SerialNumber } from "./serial-number";
import { InstanceId, BatchId } from "./instance";
import { ProductInstance } from "./product-instance";
import { PackageInstance, SelectedInstance } from "./package-instance";

export class InstanceBuilder {
  private readonly id: InstanceId;
  private serialNumber: SerialNumber | undefined;
  private batchId: BatchId | undefined;

  constructor(id: InstanceId) {
    this.id = id;
  }

  withSerial(serialNumber: SerialNumber): InstanceBuilder {
    this.serialNumber = serialNumber;
    return this;
  }

  withBatch(batchId: BatchId): InstanceBuilder {
    this.batchId = batchId;
    return this;
  }

  /** Start building a ProductInstance. */
  asProductInstance(productType: ProductType): ProductInstanceBuilder {
    return new ProductInstanceBuilder(
      this.id,
      this.serialNumber,
      this.batchId,
      productType,
    );
  }

  /** Start building a PackageInstance. */
  asPackageInstance(packageType: PackageType): PackageInstanceBuilder {
    return new PackageInstanceBuilder(
      this.id,
      this.serialNumber,
      this.batchId,
      packageType,
    );
  }
}

// ─── ProductInstanceBuilder ───────────────────────────────────────────────────

export class ProductInstanceBuilder {
  private readonly id: InstanceId;
  private readonly serialNumber: SerialNumber | undefined;
  private readonly batchId: BatchId | undefined;
  private readonly productType: ProductType;
  private quantity: Quantity | undefined;
  private readonly features: ProductFeatureInstance[] = [];

  constructor(
    id: InstanceId,
    serialNumber: SerialNumber | undefined,
    batchId: BatchId | undefined,
    productType: ProductType,
  ) {
    this.id = id;
    this.serialNumber = serialNumber;
    this.batchId = batchId;
    this.productType = productType;
  }

  withQuantity(quantity: Quantity): ProductInstanceBuilder {
    this.quantity = quantity;
    return this;
  }

  withFeature(
    featureType: ProductFeatureType,
    value: unknown,
  ): ProductInstanceBuilder {
    this.features.push(new ProductFeatureInstance(featureType, value));
    return this;
  }

  withFeatureInstance(feature: ProductFeatureInstance): ProductInstanceBuilder {
    this.features.push(feature);
    return this;
  }

  build(): ProductInstance {
    return new ProductInstance(
      this.id,
      this.productType,
      this.serialNumber,
      this.batchId,
      this.quantity,
      new ProductFeatureInstances(this.features),
    );
  }
}

// ─── PackageInstanceBuilder ───────────────────────────────────────────────────

export class PackageInstanceBuilder {
  private readonly id: InstanceId;
  private readonly serialNumber: SerialNumber | undefined;
  private readonly batchId: BatchId | undefined;
  private readonly packageType: PackageType;
  private selection: SelectedInstance[] = [];

  constructor(
    id: InstanceId,
    serialNumber: SerialNumber | undefined,
    batchId: BatchId | undefined,
    packageType: PackageType,
  ) {
    this.id = id;
    this.serialNumber = serialNumber;
    this.batchId = batchId;
    this.packageType = packageType;
  }

  withSelection(selection: SelectedInstance[]): PackageInstanceBuilder {
    this.selection = selection;
    return this;
  }

  build(): PackageInstance {
    return new PackageInstance(
      this.id,
      this.packageType,
      this.selection,
      this.serialNumber,
      this.batchId,
    );
  }
}
