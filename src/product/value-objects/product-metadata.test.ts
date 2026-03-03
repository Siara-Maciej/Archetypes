import { ProductMetadata } from "./product-metadata";

describe("ProductMetadata", () => {
  it("should create empty metadata", () => {
    const meta = ProductMetadata.empty();
    expect(meta.has("anything")).toBe(false);
    expect(meta.get("anything")).toBeUndefined();
  });

  it("should create from plain object", () => {
    const meta = ProductMetadata.of({ brand: "Nike", color: "red" });
    expect(meta.get("brand")).toBe("Nike");
    expect(meta.get("color")).toBe("red");
    expect(meta.has("brand")).toBe(true);
    expect(meta.has("missing")).toBe(false);
  });

  it("should return default value for missing key", () => {
    const meta = ProductMetadata.empty();
    expect(meta.getOrDefault("missing", "default")).toBe("default");
  });

  it("should add key-value immutably via with()", () => {
    const original = ProductMetadata.of({ brand: "Nike" });
    const updated = original.with("color", "red");

    expect(updated.get("color")).toBe("red");
    expect(updated.get("brand")).toBe("Nike");
    // original should be unchanged
    expect(original.has("color")).toBe(false);
  });

  it("should overwrite existing key via with()", () => {
    const meta = ProductMetadata.of({ brand: "Nike" });
    const updated = meta.with("brand", "Adidas");
    expect(updated.get("brand")).toBe("Adidas");
    expect(meta.get("brand")).toBe("Nike");
  });

  it("should convert to record", () => {
    const meta = ProductMetadata.of({ a: "1", b: "2" });
    const record = meta.asRecord();
    expect(record).toEqual({ a: "1", b: "2" });
  });

  it("should create from Map", () => {
    const map = new Map([["key", "value"]]);
    const meta = ProductMetadata.fromMap(map);
    expect(meta.get("key")).toBe("value");
  });
});
