import { ProductFeatureInstance, ProductFeatureInstances } from "./product-feature-instance";
import { ProductFeatureType, ProductFeatureTypeDefinition, ProductFeatureTypes } from "./product-feature-type";
import { FeatureValueType } from "./feature-value-type";

describe("ProductFeatureInstance", () => {
  const colorFeature = ProductFeatureType.withAllowedValues("color", "red", "blue", "green");
  const yearFeature = ProductFeatureType.withNumericRange("year", 2020, 2025);
  const weightFeature = ProductFeatureType.withDecimalRange("weight", "0.5", "100.0");
  const boolFeature = ProductFeatureType.unconstrained("organic", FeatureValueType.BOOLEAN);
  const dateFeature = ProductFeatureType.withDateRange("expiry", "2024-01-01", "2024-12-31");

  describe("creation", () => {
    it("should create with valid TEXT value", () => {
      const instance = ProductFeatureInstance.of(colorFeature, "red");
      expect(instance.value).toBe("red");
      expect(instance.featureType.name).toBe("color");
    });

    it("should create with valid INTEGER value", () => {
      const instance = ProductFeatureInstance.of(yearFeature, 2022);
      expect(instance.value).toBe(2022);
    });

    it("should create with valid DECIMAL value", () => {
      const instance = ProductFeatureInstance.of(weightFeature, 50.5);
      expect(instance.value).toBe(50.5);
    });

    it("should create with valid BOOLEAN value", () => {
      const instance = ProductFeatureInstance.of(boolFeature, true);
      expect(instance.value).toBe(true);
    });

    it("should create with valid DATE value", () => {
      const instance = ProductFeatureInstance.of(dateFeature, "2024-06-15");
      expect(instance.value).toBe("2024-06-15");
    });

    it("should reject invalid value", () => {
      expect(() => ProductFeatureInstance.of(colorFeature, "yellow")).toThrow();
      expect(() => ProductFeatureInstance.of(yearFeature, 2019)).toThrow();
    });

    it("should reject null value", () => {
      expect(() => ProductFeatureInstance.of(colorFeature, null)).toThrow();
    });
  });

  describe("typed accessors", () => {
    it("should return string via asString", () => {
      const instance = ProductFeatureInstance.of(colorFeature, "red");
      expect(instance.asString()).toBe("red");
    });

    it("should return int via asInt", () => {
      const instance = ProductFeatureInstance.of(yearFeature, 2022);
      expect(instance.asInt()).toBe(2022);
    });

    it("should return decimal via asDecimal", () => {
      const instance = ProductFeatureInstance.of(weightFeature, 50.5);
      expect(instance.asDecimal()).toBe(50.5);
    });

    it("should return boolean via asBoolean", () => {
      const instance = ProductFeatureInstance.of(boolFeature, true);
      expect(instance.asBoolean()).toBe(true);
    });

    it("should return date via asDate", () => {
      const instance = ProductFeatureInstance.of(dateFeature, "2024-06-15");
      expect(instance.asDate()).toBe("2024-06-15");
    });

    it("should throw on wrong accessor type", () => {
      const instance = ProductFeatureInstance.of(colorFeature, "red");
      expect(() => instance.asInt()).toThrow();
      expect(() => instance.asBoolean()).toThrow();
    });
  });

  describe("fromString", () => {
    it("should parse from string representation", () => {
      const instance = ProductFeatureInstance.fromString(yearFeature, "2022");
      expect(instance.value).toBe(2022);
    });
  });

  describe("valueAsString", () => {
    it("should convert to string representation", () => {
      const instance = ProductFeatureInstance.of(yearFeature, 2022);
      expect(instance.valueAsString()).toBe("2022");
    });
  });
});

describe("ProductFeatureInstances", () => {
  const colorFeature = ProductFeatureType.withAllowedValues("color", "red", "blue");
  const sizeFeature = ProductFeatureType.withAllowedValues("size", "S", "M", "L");
  const notesFeature = ProductFeatureType.unconstrained("notes", FeatureValueType.TEXT);

  describe("container operations", () => {
    it("should create empty container", () => {
      const instances = ProductFeatureInstances.empty();
      expect(instances.size).toBe(0);
      expect(instances.isEmpty).toBe(true);
    });

    it("should store and retrieve instances", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
        ProductFeatureInstance.of(sizeFeature, "M"),
      );
      expect(instances.size).toBe(2);
      expect(instances.get("color")?.value).toBe("red");
      expect(instances.get("size")?.value).toBe("M");
    });

    it("should check existence by name and type", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
      );
      expect(instances.has("color")).toBe(true);
      expect(instances.has("size")).toBe(false);
      expect(instances.hasType(colorFeature)).toBe(true);
      expect(instances.hasType(sizeFeature)).toBe(false);
    });

    it("should get by feature type", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "blue"),
      );
      expect(instances.getByType(colorFeature)?.value).toBe("blue");
    });

    it("should return all instances", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
        ProductFeatureInstance.of(sizeFeature, "L"),
      );
      expect(instances.all().length).toBe(2);
    });
  });

  describe("validateAgainst", () => {
    const featureTypes = ProductFeatureTypes.of(
      ProductFeatureTypeDefinition.mandatoryOf(colorFeature),
      ProductFeatureTypeDefinition.mandatoryOf(sizeFeature),
      ProductFeatureTypeDefinition.optionalOf(notesFeature),
    );

    it("should pass when all mandatory features present", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
        ProductFeatureInstance.of(sizeFeature, "M"),
      );
      expect(() => instances.validateAgainst(featureTypes)).not.toThrow();
    });

    it("should pass with optional features included", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
        ProductFeatureInstance.of(sizeFeature, "M"),
        ProductFeatureInstance.of(notesFeature, "some note"),
      );
      expect(() => instances.validateAgainst(featureTypes)).not.toThrow();
    });

    it("should fail when mandatory feature missing", () => {
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
      );
      expect(() => instances.validateAgainst(featureTypes)).toThrow(
        "Mandatory feature 'size' is missing",
      );
    });

    it("should fail when undefined feature provided", () => {
      const extraFeature = ProductFeatureType.unconstrained("extra", FeatureValueType.TEXT);
      const instances = ProductFeatureInstances.of(
        ProductFeatureInstance.of(colorFeature, "red"),
        ProductFeatureInstance.of(sizeFeature, "M"),
        ProductFeatureInstance.of(extraFeature, "data"),
      );
      expect(() => instances.validateAgainst(featureTypes)).toThrow(
        "Feature 'extra' is not defined in ProductType",
      );
    });
  });
});
