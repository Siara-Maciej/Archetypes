import { ProductConfiguration } from "./product-configuration";
import { Result } from "../shared/result";
import { DefineProductType } from "../cqrs/commands";

describe("ProductFacade", () => {
  let config: ReturnType<typeof ProductConfiguration.inMemory>;

  beforeEach(() => {
    config = ProductConfiguration.inMemory();
  });

  function defineSimpleProduct(overrides?: Partial<DefineProductType>): DefineProductType {
    return {
      productIdType: "UUID",
      productId: `product-${Date.now()}-${Math.random()}`,
      name: "Test Product",
      description: "A test product",
      unit: "pcs",
      trackingStrategy: "IDENTICAL",
      ...overrides,
    };
  }

  describe("handleDefineProductType", () => {
    it("should define a simple product", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({ productId: "my-product" }),
      );

      expect(Result.isSuccess(result)).toBe(true);
      expect(Result.getOrThrow(result).value).toBe("my-product");
    });

    it("should define a product with mandatory features", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          productId: "featured-product",
          trackingStrategy: "INDIVIDUALLY_TRACKED",
          mandatoryFeatures: [
            {
              name: "color",
              constraint: {
                kind: "allowedValues",
                allowedValues: new Set(["red", "blue", "green"]),
              },
            },
          ],
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should define a product with optional features", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          optionalFeatures: [
            {
              name: "year",
              constraint: {
                kind: "numericRange",
                min: 2020,
                max: 2025,
              },
            },
          ],
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should define a product with regex constraint", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          mandatoryFeatures: [
            {
              name: "code",
              constraint: {
                kind: "regex",
                pattern: "^[A-Z]{2}-\\d{4}$",
              },
            },
          ],
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should define a product with date range constraint", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          mandatoryFeatures: [
            {
              name: "expiry",
              constraint: {
                kind: "dateRange",
                from: "2024-01-01",
                to: "2024-12-31",
              },
            },
          ],
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should define a product with decimal range constraint", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          mandatoryFeatures: [
            {
              name: "weight",
              constraint: {
                kind: "decimalRange",
                min: "0.5",
                max: "100.0",
              },
            },
          ],
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should define a product with unconstrained feature", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          optionalFeatures: [
            {
              name: "notes",
              constraint: {
                kind: "unconstrained",
                valueType: "TEXT",
              },
            },
          ],
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should define a product with metadata", () => {
      const result = config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          productId: "meta-product",
          metadata: { brand: "Nike", season: "summer" },
        }),
      );

      expect(Result.isSuccess(result)).toBe(true);
    });
  });

  describe("findByProductId", () => {
    it("should find existing product", () => {
      config.productFacade.handleDefineProductType(
        defineSimpleProduct({ productId: "findable" }),
      );

      const view = config.productFacade.findByProductId({ productId: "findable" });
      expect(view).toBeDefined();
      expect(view!.productId).toBe("findable");
      expect(view!.name).toBe("Test Product");
      expect(view!.unit).toBe("pcs");
      expect(view!.trackingStrategy).toBe("IDENTICAL");
    });

    it("should return undefined for non-existing product", () => {
      const view = config.productFacade.findByProductId({ productId: "nonexistent" });
      expect(view).toBeUndefined();
    });

    it("should include feature types in view", () => {
      config.productFacade.handleDefineProductType(
        defineSimpleProduct({
          productId: "with-features",
          mandatoryFeatures: [
            {
              name: "color",
              constraint: { kind: "allowedValues", allowedValues: new Set(["red", "blue"]) },
            },
          ],
          optionalFeatures: [
            {
              name: "notes",
              constraint: { kind: "unconstrained", valueType: "TEXT" },
            },
          ],
        }),
      );

      const view = config.productFacade.findByProductId({ productId: "with-features" });
      expect(view).toBeDefined();
      expect(view!.mandatoryFeatures.length).toBe(1);
      expect(view!.mandatoryFeatures[0].name).toBe("color");
      expect(view!.optionalFeatures.length).toBe(1);
      expect(view!.optionalFeatures[0].name).toBe("notes");
    });
  });

  describe("findByTrackingStrategy", () => {
    it("should find products by tracking strategy", () => {
      config.productFacade.handleDefineProductType(
        defineSimpleProduct({ productId: "identical-1", trackingStrategy: "IDENTICAL" }),
      );
      config.productFacade.handleDefineProductType(
        defineSimpleProduct({ productId: "tracked-1", trackingStrategy: "INDIVIDUALLY_TRACKED" }),
      );
      config.productFacade.handleDefineProductType(
        defineSimpleProduct({ productId: "identical-2", trackingStrategy: "IDENTICAL" }),
      );

      const identical = config.productFacade.findByTrackingStrategy({
        trackingStrategy: "IDENTICAL",
      });
      expect(identical.length).toBe(2);

      const tracked = config.productFacade.findByTrackingStrategy({
        trackingStrategy: "INDIVIDUALLY_TRACKED",
      });
      expect(tracked.length).toBe(1);
    });
  });
});
