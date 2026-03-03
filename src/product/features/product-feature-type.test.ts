import { ProductFeatureType, ProductFeatureTypeDefinition, ProductFeatureTypes } from "./product-feature-type";
import { FeatureValueType } from "./feature-value-type";

describe("ProductFeatureType", () => {
  describe("factory methods", () => {
    it("should create withAllowedValues", () => {
      const ft = ProductFeatureType.withAllowedValues("color", "red", "blue", "green");
      expect(ft.name).toBe("color");
      expect(ft.isValidValue("red")).toBe(true);
      expect(ft.isValidValue("yellow")).toBe(false);
    });

    it("should create withNumericRange", () => {
      const ft = ProductFeatureType.withNumericRange("year", 2020, 2025);
      expect(ft.name).toBe("year");
      expect(ft.isValidValue(2022)).toBe(true);
      expect(ft.isValidValue(2019)).toBe(false);
    });

    it("should create withDecimalRange", () => {
      const ft = ProductFeatureType.withDecimalRange("weight", "0.5", "100.0");
      expect(ft.name).toBe("weight");
      expect(ft.isValidValue(50.5)).toBe(true);
      expect(ft.isValidValue(200)).toBe(false);
    });

    it("should create withRegex", () => {
      const ft = ProductFeatureType.withRegex("code", "^[A-Z]{2}-\\d{4}$");
      expect(ft.name).toBe("code");
      expect(ft.isValidValue("AB-1234")).toBe(true);
      expect(ft.isValidValue("invalid")).toBe(false);
    });

    it("should create withDateRange", () => {
      const ft = ProductFeatureType.withDateRange("expiry", "2024-01-01", "2024-12-31");
      expect(ft.name).toBe("expiry");
      expect(ft.isValidValue("2024-06-15")).toBe(true);
      expect(ft.isValidValue("2025-01-01")).toBe(false);
    });

    it("should create unconstrained", () => {
      const ft = ProductFeatureType.unconstrained("notes", FeatureValueType.TEXT);
      expect(ft.name).toBe("notes");
      expect(ft.isValidValue("anything")).toBe(true);
    });
  });

  describe("validation", () => {
    const colorFeature = ProductFeatureType.withAllowedValues("color", "red", "blue");

    it("should validate correct values", () => {
      expect(() => colorFeature.validateValue("red")).not.toThrow();
    });

    it("should throw on invalid values", () => {
      expect(() => colorFeature.validateValue("green")).toThrow();
    });

    it("should throw on null value", () => {
      expect(() => colorFeature.validateValue(null)).toThrow();
    });
  });

  describe("name validation", () => {
    it("should reject blank name", () => {
      expect(() => ProductFeatureType.withAllowedValues("", "a")).toThrow();
      expect(() => ProductFeatureType.withAllowedValues("   ", "a")).toThrow();
    });
  });
});

describe("ProductFeatureTypeDefinition", () => {
  const color = ProductFeatureType.withAllowedValues("color", "red", "blue");

  it("should create mandatory definition", () => {
    const def = ProductFeatureTypeDefinition.mandatoryOf(color);
    expect(def.mandatory).toBe(true);
    expect(def.isOptional).toBe(false);
    expect(def.featureType.name).toBe("color");
  });

  it("should create optional definition", () => {
    const def = ProductFeatureTypeDefinition.optionalOf(color);
    expect(def.mandatory).toBe(false);
    expect(def.isOptional).toBe(true);
  });
});

describe("ProductFeatureTypes", () => {
  const color = ProductFeatureType.withAllowedValues("color", "red", "blue");
  const size = ProductFeatureType.withAllowedValues("size", "S", "M", "L");
  const notes = ProductFeatureType.unconstrained("notes", FeatureValueType.TEXT);

  const featureTypes = ProductFeatureTypes.of(
    ProductFeatureTypeDefinition.mandatoryOf(color),
    ProductFeatureTypeDefinition.mandatoryOf(size),
    ProductFeatureTypeDefinition.optionalOf(notes),
  );

  it("should report correct size", () => {
    expect(featureTypes.size).toBe(3);
    expect(featureTypes.isEmpty).toBe(false);
  });

  it("should find features by name", () => {
    expect(featureTypes.has("color")).toBe(true);
    expect(featureTypes.has("missing")).toBe(false);
    expect(featureTypes.getFeatureType("color")?.name).toBe("color");
  });

  it("should report mandatory status", () => {
    expect(featureTypes.isMandatory("color")).toBe(true);
    expect(featureTypes.isMandatory("notes")).toBe(false);
  });

  it("should return mandatory features", () => {
    const mandatory = featureTypes.mandatoryFeatures();
    expect(mandatory.length).toBe(2);
    expect(mandatory.map((f) => f.name)).toContain("color");
    expect(mandatory.map((f) => f.name)).toContain("size");
  });

  it("should return optional features", () => {
    const optional = featureTypes.optionalFeatures();
    expect(optional.length).toBe(1);
    expect(optional[0].name).toBe("notes");
  });

  it("should return all features", () => {
    expect(featureTypes.allFeatures().length).toBe(3);
  });

  it("should handle empty feature types", () => {
    const empty = ProductFeatureTypes.empty();
    expect(empty.size).toBe(0);
    expect(empty.isEmpty).toBe(true);
    expect(empty.mandatoryFeatures()).toEqual([]);
    expect(empty.optionalFeatures()).toEqual([]);
  });
});
