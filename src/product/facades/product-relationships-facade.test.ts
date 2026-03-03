import { ProductConfiguration } from "./product-configuration";
import { Result } from "../shared/result";
import { UuidProductIdentifier } from "../value-objects/product-identifier";

describe("ProductRelationshipsFacade", () => {
  let config: ReturnType<typeof ProductConfiguration.inMemory>;

  beforeEach(() => {
    config = ProductConfiguration.inMemory();
    // Define two products
    config.productFacade.handleDefineProductType({
      productIdType: "UUID",
      productId: "product-a",
      name: "Product A",
      description: "Product A desc",
      unit: "pcs",
      trackingStrategy: "IDENTICAL",
    });
    config.productFacade.handleDefineProductType({
      productIdType: "UUID",
      productId: "product-b",
      name: "Product B",
      description: "Product B desc",
      unit: "pcs",
      trackingStrategy: "IDENTICAL",
    });
  });

  describe("handleDefineRelationship", () => {
    it("should define a relationship", () => {
      const result = config.productRelationshipsFacade.handleDefineRelationship({
        fromProductId: "product-a",
        toProductId: "product-b",
        relationshipType: "UPGRADABLE_TO",
      });

      expect(Result.isSuccess(result)).toBe(true);
    });

    it("should fail for non-existing from product", () => {
      const result = config.productRelationshipsFacade.handleDefineRelationship({
        fromProductId: "nonexistent",
        toProductId: "product-b",
        relationshipType: "UPGRADABLE_TO",
      });

      expect(Result.isFailure(result)).toBe(true);
      expect(Result.getFailure(result)).toContain("PRODUCT_NOT_FOUND");
    });

    it("should fail for non-existing to product", () => {
      const result = config.productRelationshipsFacade.handleDefineRelationship({
        fromProductId: "product-a",
        toProductId: "nonexistent",
        relationshipType: "UPGRADABLE_TO",
      });

      expect(Result.isFailure(result)).toBe(true);
      expect(Result.getFailure(result)).toContain("PRODUCT_NOT_FOUND");
    });
  });

  describe("findAllRelationsFrom", () => {
    it("should find all relations from a product", () => {
      config.productRelationshipsFacade.handleDefineRelationship({
        fromProductId: "product-a",
        toProductId: "product-b",
        relationshipType: "UPGRADABLE_TO",
      });
      config.productRelationshipsFacade.handleDefineRelationship({
        fromProductId: "product-a",
        toProductId: "product-b",
        relationshipType: "COMPLEMENTED_BY",
      });

      const from = UuidProductIdentifier.of("product-a");
      const relations = config.productRelationshipsFacade.findAllRelationsFrom(from);
      expect(relations.length).toBe(2);
    });

    it("should return empty for product with no relations", () => {
      const from = UuidProductIdentifier.of("product-b");
      const relations = config.productRelationshipsFacade.findAllRelationsFrom(from);
      expect(relations.length).toBe(0);
    });
  });

  describe("handleRemoveRelationship", () => {
    it("should remove a relationship", () => {
      const defineResult = config.productRelationshipsFacade.handleDefineRelationship({
        fromProductId: "product-a",
        toProductId: "product-b",
        relationshipType: "UPGRADABLE_TO",
      });

      const relationshipId = Result.getOrThrow(defineResult).value;
      const removeResult = config.productRelationshipsFacade.handleRemoveRelationship({
        relationshipId,
      });

      expect(Result.isSuccess(removeResult)).toBe(true);

      const from = UuidProductIdentifier.of("product-a");
      const relations = config.productRelationshipsFacade.findAllRelationsFrom(from);
      expect(relations.length).toBe(0);
    });
  });
});
