import { CatalogEntry, CatalogEntryId } from "./catalog-entry";
import { ProductType } from "../domain/product-type";
import { UuidProductIdentifier } from "../value-objects/product-identifier";
import { ProductName } from "../value-objects/product-name";
import { ProductDescription } from "../value-objects/product-description";
import { Validity } from "../value-objects/validity";
import { Unit } from "../value-objects/quantity";

describe("CatalogEntry", () => {
  const product = ProductType.define(
    UuidProductIdentifier.of("prod-1"),
    new ProductName("Laptop"),
    new ProductDescription("A laptop"),
  );

  function buildEntry(overrides?: {
    validity?: Validity;
    categories?: Set<string>;
    metadata?: Record<string, string>;
  }): CatalogEntry {
    return CatalogEntry.builder()
      .id(CatalogEntryId.of("CATALOG-1"))
      .displayName("Amazing Laptop")
      .description("The best laptop ever")
      .product(product)
      .categories(overrides?.categories ?? new Set(["electronics", "computers"]))
      .validity(overrides?.validity ?? Validity.between("2024-01-01", "2024-12-31"))
      .metadata(overrides?.metadata ?? { promo: "summer" })
      .build();
  }

  describe("basic properties", () => {
    it("should have correct display name and description", () => {
      const entry = buildEntry();
      expect(entry.displayName).toBe("Amazing Laptop");
      expect(entry.description).toBe("The best laptop ever");
    });

    it("should reference the product", () => {
      const entry = buildEntry();
      expect(entry.product.id.value).toBe("prod-1");
    });

    it("should have an ID", () => {
      const entry = buildEntry();
      expect(entry.id.value).toBe("CATALOG-1");
    });
  });

  describe("availability", () => {
    it("should be available within validity range", () => {
      const entry = buildEntry({
        validity: Validity.between("2024-01-01", "2024-12-31"),
      });
      expect(entry.isAvailableAt("2024-06-15")).toBe(true);
      expect(entry.isAvailableAt("2024-01-01")).toBe(true);
      expect(entry.isAvailableAt("2024-12-31")).toBe(true);
    });

    it("should not be available outside validity range", () => {
      const entry = buildEntry({
        validity: Validity.between("2024-01-01", "2024-12-31"),
      });
      expect(entry.isAvailableAt("2023-12-31")).toBe(false);
      expect(entry.isAvailableAt("2025-01-01")).toBe(false);
    });

    it("should always be available with Validity.always()", () => {
      const entry = buildEntry({ validity: Validity.always() });
      expect(entry.isAvailableAt("2024-06-15")).toBe(true);
      expect(entry.isAvailableAt("2000-01-01")).toBe(true);
    });
  });

  describe("categories", () => {
    it("should check category membership", () => {
      const entry = buildEntry({
        categories: new Set(["electronics", "computers"]),
      });
      expect(entry.isInCategory("electronics")).toBe(true);
      expect(entry.isInCategory("computers")).toBe(true);
      expect(entry.isInCategory("books")).toBe(false);
    });
  });

  describe("metadata", () => {
    it("should get metadata value", () => {
      const entry = buildEntry({ metadata: { promo: "summer", tier: "premium" } });
      expect(entry.getMetadata("promo")).toBe("summer");
      expect(entry.getMetadata("tier")).toBe("premium");
      expect(entry.getMetadata("missing")).toBeUndefined();
    });

    it("should get metadata with default", () => {
      const entry = buildEntry({ metadata: {} });
      expect(entry.getMetadataOrDefault("missing", "default")).toBe("default");
    });

    it("should check metadata existence", () => {
      const entry = buildEntry({ metadata: { key: "val" } });
      expect(entry.hasMetadata("key")).toBe(true);
      expect(entry.hasMetadata("missing")).toBe(false);
    });
  });

  describe("immutable copy methods", () => {
    it("should create new entry with updated validity", () => {
      const entry = buildEntry({ validity: Validity.always() });
      const updated = entry.withValidity(Validity.until("2025-06-30"));

      expect(updated.validity.to).toBe("2025-06-30");
      // original unchanged
      expect(entry.validity.to).toBeUndefined();
      // other fields preserved
      expect(updated.displayName).toBe(entry.displayName);
      expect(updated.id.value).toBe(entry.id.value);
    });

    it("should create new entry with updated metadata", () => {
      const entry = buildEntry({ metadata: { a: "1" } });
      const updated = entry.withMetadata({ b: "2" });

      expect(updated.getMetadata("b")).toBe("2");
      expect(updated.getMetadata("a")).toBeUndefined();
      // original unchanged
      expect(entry.getMetadata("a")).toBe("1");
    });
  });
});

describe("CatalogEntryId", () => {
  it("should create from value", () => {
    const id = CatalogEntryId.of("my-id");
    expect(id.value).toBe("my-id");
  });

  it("should generate with CATALOG- prefix", () => {
    const id = CatalogEntryId.generate();
    expect(id.value).toMatch(/^CATALOG-/);
  });

  it("should reject blank value", () => {
    expect(() => CatalogEntryId.of("")).toThrow();
    expect(() => CatalogEntryId.of("   ")).toThrow();
  });
});
