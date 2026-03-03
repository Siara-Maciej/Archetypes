import { InstanceBuilder } from "./instance-builder";
import { InstanceId, BatchId } from "./instance";
import { ProductInstance } from "./product-instance";
import { PackageInstance, SelectedInstance } from "./package-instance";
import { SerialNumber, TextualSerialNumber } from "./serial-number";
import { ProductType } from "../domain/product-type";
import { ProductBuilder } from "../domain/product-builder";
import { UuidProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { Unit, Quantity } from "../value-objects/quantity";
import { ProductFeatureType } from "../features/product-feature-type";

describe("InstanceBuilder", () => {
  const productId = UuidProductIdentifier.of("laptop");
  const productName = new ProductName("Laptop");
  const productDesc = new ProductDescription("A laptop");

  describe("ProductInstance building", () => {
    it("should build IDENTICAL instance (no serial/batch)", () => {
      const productType = ProductType.identical(
        productId, productName, productDesc, Unit.pieces(),
      );

      const instance = new InstanceBuilder(InstanceId.newOne())
        .asProductInstance(productType)
        .build();

      expect(instance).toBeInstanceOf(ProductInstance);
      expect(instance.serialNumber).toBeUndefined();
      expect(instance.batchId).toBeUndefined();
    });

    it("should build INDIVIDUALLY_TRACKED instance with serial", () => {
      const productType = ProductType.individuallyTracked(
        productId, productName, productDesc, Unit.pieces(),
      );
      const serial = TextualSerialNumber.of("SN-001");

      const instance = new InstanceBuilder(InstanceId.newOne())
        .withSerial(serial)
        .asProductInstance(productType)
        .build();

      expect(instance.serialNumber).toBeDefined();
      expect(instance.serialNumber!.value).toBe("SN-001");
    });

    it("should build BATCH_TRACKED instance with batch ID", () => {
      const productType = ProductType.batchTracked(
        productId, productName, productDesc, Unit.pieces(),
      );
      const batchId = BatchId.of("BATCH-2024-001");

      const instance = new InstanceBuilder(InstanceId.newOne())
        .withBatch(batchId)
        .asProductInstance(productType)
        .build();

      expect(instance.batchId).toBeDefined();
      expect(instance.batchId!.value).toBe("BATCH-2024-001");
    });

    it("should build instance with quantity", () => {
      const productType = ProductType.identical(
        productId, productName, productDesc, Unit.kilograms(),
      );

      const instance = new InstanceBuilder(InstanceId.newOne())
        .asProductInstance(productType)
        .withQuantity(Quantity.of(5, Unit.kilograms()))
        .build();

      expect(instance.quantity?.amount).toBe(5);
      expect(instance.quantity?.unit.symbol).toBe("kg");
    });

    it("should build instance with features", () => {
      const color = ProductFeatureType.withAllowedValues("color", "red", "blue");
      const productType = new ProductBuilder(productId, productName, productDesc)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .withMandatoryFeature(color)
        .build();

      const instance = new InstanceBuilder(InstanceId.newOne())
        .asProductInstance(productType)
        .withFeature(color, "red")
        .build();

      expect(instance.features.get("color")?.value).toBe("red");
    });

    it("should reject missing serial for INDIVIDUALLY_TRACKED", () => {
      const productType = ProductType.individuallyTracked(
        productId, productName, productDesc, Unit.pieces(),
      );

      expect(() =>
        new InstanceBuilder(InstanceId.newOne())
          .asProductInstance(productType)
          .build()
      ).toThrow();
    });

    it("should reject missing batch for BATCH_TRACKED", () => {
      const productType = ProductType.batchTracked(
        productId, productName, productDesc, Unit.pieces(),
      );

      expect(() =>
        new InstanceBuilder(InstanceId.newOne())
          .asProductInstance(productType)
          .build()
      ).toThrow();
    });

    it("should reject wrong quantity unit", () => {
      const productType = ProductType.identical(
        productId, productName, productDesc, Unit.kilograms(),
      );

      expect(() =>
        new InstanceBuilder(InstanceId.newOne())
          .asProductInstance(productType)
          .withQuantity(Quantity.of(5, Unit.liters()))
          .build()
      ).toThrow("Quantity unit must match");
    });

    it("should reject missing mandatory feature", () => {
      const color = ProductFeatureType.withAllowedValues("color", "red", "blue");
      const productType = new ProductBuilder(productId, productName, productDesc)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .withMandatoryFeature(color)
        .build();

      expect(() =>
        new InstanceBuilder(InstanceId.newOne())
          .asProductInstance(productType)
          .build()
      ).toThrow("Mandatory feature 'color' is missing");
    });

    it("should reject IDENTICAL product with serial number", () => {
      const productType = ProductType.identical(
        productId, productName, productDesc, Unit.pieces(),
      );

      expect(() =>
        new InstanceBuilder(InstanceId.newOne())
          .withSerial(TextualSerialNumber.of("SN-001"))
          .asProductInstance(productType)
          .build()
      ).toThrow("IDENTICAL products must not have SerialNumber or BatchId");
    });
  });

  describe("PackageInstance building", () => {
    it("should build PackageInstance with valid selection", () => {
      const p1 = UuidProductIdentifier.of("p1");
      const p2 = UuidProductIdentifier.of("p2");

      const pkgType = new ProductBuilder(
        UuidProductIdentifier.of("bundle"),
        new ProductName("Bundle"),
        new ProductDescription("Test bundle"),
      )
        .asPackageType()
        .withSingleChoice("Group", p1, p2)
        .build();

      // Create a ProductInstance to use as selected instance
      const instanceProduct = ProductType.identical(p1, new ProductName("P1"), new ProductDescription("P1 desc"), Unit.pieces());
      const productInstance = new InstanceBuilder(InstanceId.newOne())
        .asProductInstance(instanceProduct)
        .build();

      const selectedInstance = new SelectedInstance(productInstance, 1);

      const pkgInstance = new InstanceBuilder(InstanceId.newOne())
        .withSerial(TextualSerialNumber.of("PKG-001"))
        .asPackageInstance(pkgType)
        .withSelection([selectedInstance])
        .build();

      expect(pkgInstance).toBeInstanceOf(PackageInstance);
      expect(pkgInstance.selection.length).toBe(1);
    });

    it("should reject PackageInstance without serial/batch", () => {
      const p1 = UuidProductIdentifier.of("p1");

      const pkgType = new ProductBuilder(
        UuidProductIdentifier.of("bundle"),
        new ProductName("Bundle"),
        new ProductDescription("Test bundle"),
      )
        .asPackageType()
        .withSingleChoice("Group", p1)
        .build();

      const instanceProduct = ProductType.identical(p1, new ProductName("P1"), new ProductDescription("P1 desc"), Unit.pieces());
      const productInstance = new InstanceBuilder(InstanceId.newOne())
        .asProductInstance(instanceProduct)
        .build();

      const selectedInstance = new SelectedInstance(productInstance, 1);

      expect(() =>
        new InstanceBuilder(InstanceId.newOne())
          .asPackageInstance(pkgType)
          .withSelection([selectedInstance])
          .build()
      ).toThrow();
    });
  });
});
