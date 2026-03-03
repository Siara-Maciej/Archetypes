import { ProductConfiguration } from "./product-configuration";
import { Result } from "../shared/result";

describe("ProductCatalog", () => {
  let config: ReturnType<typeof ProductConfiguration.inMemory>;

  beforeEach(() => {
    config = ProductConfiguration.inMemory();
  });

  function defineProduct(id: string) {
    return config.productFacade.handleDefineProductType({
      productIdType: "UUID",
      productId: id,
      name: `Product ${id}`,
      description: `Description for ${id}`,
      unit: "pcs",
      trackingStrategy: "IDENTICAL",
    });
  }

  function addToOffer(
    productId: string,
    displayName: string,
    options?: {
      categories?: Set<string>;
      availableFrom?: string;
      availableUntil?: string;
      metadata?: Record<string, string>;
    },
  ) {
    return config.productCatalog.handleAddToOffer({
      productTypeId: productId,
      displayName,
      description: `Description for ${displayName}`,
      categories: options?.categories,
      availableFrom: options?.availableFrom,
      availableUntil: options?.availableUntil,
      metadata: options?.metadata,
    });
  }

  describe("handleAddToOffer", () => {
    it("should add product to offer", () => {
      defineProduct("p1");
      const result = addToOffer("p1", "Amazing Product");

      expect(Result.isSuccess(result)).toBe(true);
      expect(Result.getOrThrow(result).value).toContain("CATALOG-");
    });

    it("should fail for non-existing product", () => {
      const result = addToOffer("nonexistent", "Nothing");
      expect(Result.isFailure(result)).toBe(true);
      expect(Result.getFailure(result)).toContain("ProductType not found");
    });

    it("should add product with categories", () => {
      defineProduct("p1");
      const result = addToOffer("p1", "Laptop", {
        categories: new Set(["electronics", "computers"]),
      });

      expect(Result.isSuccess(result)).toBe(true);

      const entries = config.productCatalog.findByCategory({ category: "electronics" });
      expect(entries.length).toBe(1);
      expect(entries[0].displayName).toBe("Laptop");
    });

    it("should add product with validity dates", () => {
      defineProduct("p1");
      addToOffer("p1", "Seasonal", {
        availableFrom: "2024-06-01",
        availableUntil: "2024-08-31",
      });

      const available = config.productCatalog.findAvailableAt({ date: "2024-07-15" });
      expect(available.length).toBe(1);

      const unavailable = config.productCatalog.findAvailableAt({ date: "2024-12-01" });
      expect(unavailable.length).toBe(0);
    });
  });

  describe("handleDiscontinue", () => {
    it("should discontinue a product", () => {
      defineProduct("p1");
      const addResult = addToOffer("p1", "Product");
      const catalogEntryId = Result.getOrThrow(addResult).value;

      const result = config.productCatalog.handleDiscontinue({
        catalogEntryId,
        discontinuationDate: "2024-06-30",
      });

      expect(Result.isSuccess(result)).toBe(true);

      const entry = config.productCatalog.findById({ catalogEntryId });
      expect(entry).toBeDefined();
      expect(entry!.availableUntil).toBe("2024-06-30");
    });

    it("should fail for non-existing catalog entry", () => {
      const result = config.productCatalog.handleDiscontinue({
        catalogEntryId: "nonexistent",
        discontinuationDate: "2024-06-30",
      });

      expect(Result.isFailure(result)).toBe(true);
    });
  });

  describe("handleUpdateMetadata", () => {
    it("should update metadata", () => {
      defineProduct("p1");
      const addResult = addToOffer("p1", "Product", {
        metadata: { old: "value" },
      });
      const catalogEntryId = Result.getOrThrow(addResult).value;

      config.productCatalog.handleUpdateMetadata({
        catalogEntryId,
        metadata: { new: "data" },
      });

      const entry = config.productCatalog.findById({ catalogEntryId });
      expect(entry!.metadata).toEqual({ new: "data" });
    });

    it("should fail for non-existing entry", () => {
      const result = config.productCatalog.handleUpdateMetadata({
        catalogEntryId: "nonexistent",
        metadata: { a: "b" },
      });

      expect(Result.isFailure(result)).toBe(true);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      defineProduct("laptop");
      defineProduct("phone");
      defineProduct("tablet");

      addToOffer("laptop", "Amazing Laptop", {
        categories: new Set(["electronics", "computers"]),
        availableFrom: "2024-01-01",
        availableUntil: "2024-12-31",
        metadata: { brand: "TechCo" },
      });
      addToOffer("phone", "Super Phone", {
        categories: new Set(["electronics", "mobile"]),
        availableFrom: "2024-03-01",
        availableUntil: "2024-09-30",
      });
      addToOffer("tablet", "Cool Tablet", {
        categories: new Set(["electronics", "mobile"]),
        availableFrom: "2024-06-01",
      });
    });

    it("should search by text", () => {
      const results = config.productCatalog.search({ searchText: "laptop" });
      expect(results.length).toBe(1);
      expect(results[0].displayName).toBe("Amazing Laptop");
    });

    it("should search by text case-insensitively", () => {
      const results = config.productCatalog.search({ searchText: "PHONE" });
      expect(results.length).toBe(1);
    });

    it("should search by category", () => {
      const results = config.productCatalog.search({
        categories: new Set(["mobile"]),
      });
      expect(results.length).toBe(2);
    });

    it("should search by availability date", () => {
      const results = config.productCatalog.search({ availableAt: "2024-07-15" });
      expect(results.length).toBe(3);

      const results2 = config.productCatalog.search({ availableAt: "2024-02-15" });
      expect(results2.length).toBe(1);
    });

    it("should search by product type ID", () => {
      const results = config.productCatalog.search({ productTypeId: "laptop" });
      expect(results.length).toBe(1);
    });

    it("should combine search criteria", () => {
      const results = config.productCatalog.search({
        categories: new Set(["electronics"]),
        availableAt: "2024-07-15",
        searchText: "tablet",
      });
      expect(results.length).toBe(1);
      expect(results[0].displayName).toBe("Cool Tablet");
    });

    it("should return all when no criteria", () => {
      const results = config.productCatalog.search({});
      expect(results.length).toBe(3);
    });
  });

  describe("findByMetadata", () => {
    it("should find by metadata key", () => {
      defineProduct("p1");
      addToOffer("p1", "Product", { metadata: { brand: "Nike" } });

      const results = config.productCatalog.findByMetadata({ key: "brand" });
      expect(results.length).toBe(1);
    });

    it("should find by metadata key and value", () => {
      defineProduct("p1");
      defineProduct("p2");
      addToOffer("p1", "P1", { metadata: { brand: "Nike" } });
      addToOffer("p2", "P2", { metadata: { brand: "Adidas" } });

      const nike = config.productCatalog.findByMetadata({ key: "brand", value: "Nike" });
      expect(nike.length).toBe(1);
      expect(nike[0].displayName).toBe("P1");
    });
  });
});
