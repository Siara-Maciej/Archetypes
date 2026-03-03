import { ProductBuilder } from "./product-builder";
import { ProductType } from "./product-type";
import { PackageType } from "./package-type";
import { UuidProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { ProductTrackingStrategy } from "../value-objects/product-tracking-strategy";
import { Unit } from "../value-objects/quantity";
import { ProductFeatureType } from "../features/product-feature-type";
import { FeatureValueType } from "../features/feature-value-type";
import { ApplicabilityConstraint, isSatisfiedBy, ApplicabilityContext } from "../constraints/applicability-constraint";

describe("ProductBuilder", () => {
  const id = UuidProductIdentifier.of("test-product");
  const name = new ProductName("Test Product");
  const description = new ProductDescription("A test product");

  describe("ProductType building", () => {
    it("should build a basic ProductType", () => {
      const product = new ProductBuilder(id, name, description)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .build();

      expect(product).toBeInstanceOf(ProductType);
      expect(product.id.value).toBe("test-product");
      expect(product.name.value).toBe("Test Product");
      expect(product.description.value).toBe("A test product");
      expect(product.preferredUnit.symbol).toBe("pcs");
      expect(product.trackingStrategy).toBe(ProductTrackingStrategy.IDENTICAL);
      expect(product.featureTypes.isEmpty).toBe(true);
    });

    it("should build ProductType with mandatory features", () => {
      const color = ProductFeatureType.withAllowedValues("color", "red", "blue");
      const size = ProductFeatureType.withAllowedValues("size", "S", "M", "L");

      const product = new ProductBuilder(id, name, description)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.INDIVIDUALLY_TRACKED)
        .withMandatoryFeature(color)
        .withMandatoryFeature(size)
        .build();

      expect(product.featureTypes.size).toBe(2);
      expect(product.featureTypes.isMandatory("color")).toBe(true);
      expect(product.featureTypes.isMandatory("size")).toBe(true);
    });

    it("should build ProductType with optional features", () => {
      const notes = ProductFeatureType.unconstrained("notes", FeatureValueType.TEXT);

      const product = new ProductBuilder(id, name, description)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .withOptionalFeature(notes)
        .build();

      expect(product.featureTypes.size).toBe(1);
      expect(product.featureTypes.isMandatory("notes")).toBe(false);
    });

    it("should build ProductType with metadata", () => {
      const product = new ProductBuilder(id, name, description)
        .withMetadata("brand", "TestBrand")
        .withMetadata("category", "electronics")
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .build();

      expect(product.metadata.get("brand")).toBe("TestBrand");
      expect(product.metadata.get("category")).toBe("electronics");
    });

    it("should build ProductType with applicability constraint", () => {
      const constraint = ApplicabilityConstraint.equalsTo("country", "PL");

      const product = new ProductBuilder(id, name, description)
        .withApplicabilityConstraint(constraint)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .build();

      expect(isSatisfiedBy(product.applicabilityConstraint, ApplicabilityContext.of({ country: "PL" }))).toBe(true);
      expect(isSatisfiedBy(product.applicabilityConstraint, ApplicabilityContext.of({ country: "DE" }))).toBe(false);
    });

    it("should set metadata via ProductTypeBuilder", () => {
      const product = new ProductBuilder(id, name, description)
        .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL)
        .withMetadata("key", "value")
        .build();

      expect(product.metadata.get("key")).toBe("value");
    });
  });

  describe("PackageType building", () => {
    const p1 = UuidProductIdentifier.of("product-1");
    const p2 = UuidProductIdentifier.of("product-2");
    const p3 = UuidProductIdentifier.of("product-3");

    it("should build a PackageType with single choice", () => {
      const pkg = new ProductBuilder(id, name, description)
        .asPackageType()
        .withSingleChoice("Memory", p1, p2)
        .build();

      expect(pkg).toBeInstanceOf(PackageType);
      expect(pkg.id.value).toBe("test-product");
      expect(pkg.structure.productSets.size).toBe(1);
      expect(pkg.structure.selectionRules.length).toBe(1);
    });

    it("should build a PackageType with optional choice", () => {
      const pkg = new ProductBuilder(id, name, description)
        .asPackageType()
        .withOptionalChoice("Accessories", p1, p2)
        .withSingleChoice("Core", p3)
        .build();

      expect(pkg.structure.productSets.size).toBe(2);
      expect(pkg.structure.selectionRules.length).toBe(2);
    });

    it("should build a PackageType with required choice", () => {
      const pkg = new ProductBuilder(id, name, description)
        .asPackageType()
        .withRequiredChoice("Required", p1, p2, p3)
        .build();

      expect(pkg.structure.productSets.size).toBe(1);
    });

    it("should build a PackageType with custom choice", () => {
      const pkg = new ProductBuilder(id, name, description)
        .asPackageType()
        .withChoice("Custom", 2, 3, p1, p2, p3)
        .build();

      expect(pkg.structure.productSets.size).toBe(1);
    });

    it("should set metadata via PackageTypeBuilder", () => {
      const pkg = new ProductBuilder(id, name, description)
        .asPackageType()
        .withMetadata("key", "value")
        .withSingleChoice("Group", p1)
        .build();

      expect(pkg.metadata.get("key")).toBe("value");
    });

    it("should get product set by name", () => {
      const builder = new ProductBuilder(id, name, description)
        .asPackageType()
        .withSingleChoice("Memory", p1, p2);

      const set = builder.getProductSet("Memory");
      expect(set).toBeDefined();
      expect(set!.name).toBe("Memory");
    });
  });
});
