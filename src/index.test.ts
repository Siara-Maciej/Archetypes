import { ProductType } from "./product";
import { UuidProductIdentifier } from "./product/value-objects/product-identifier";
import { ProductName } from "./product/value-objects/product-name";
import { ProductDescription } from "./product/value-objects/product-description";

describe("Product Archetype - smoke test", () => {
  it("should create a simple ProductType", () => {
    const product = ProductType.define(
      UuidProductIdentifier.random(),
      new ProductName("Test Product"),
      new ProductDescription("A test product"),
    );

    expect(product.name.value).toBe("Test Product");
    expect(product.description.value).toBe("A test product");
  });
});
