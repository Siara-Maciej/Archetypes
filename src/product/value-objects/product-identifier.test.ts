import {
  UuidProductIdentifier,
  IsbnProductIdentifier,
  GtinProductIdentifier,
  parseProductIdentifier,
  productIdentifierEquals,
  productIdentifierKey,
} from "./product-identifier";

describe("ProductIdentifier", () => {
  describe("UuidProductIdentifier", () => {
    it("should create random UUID", () => {
      const id = UuidProductIdentifier.random();
      expect(id.idType).toBe("UUID");
      expect(id.value).toBeTruthy();
    });

    it("should create from value", () => {
      const id = UuidProductIdentifier.of("my-id");
      expect(id.idType).toBe("UUID");
      expect(id.value).toBe("my-id");
    });

    it("should reject blank UUID", () => {
      expect(() => UuidProductIdentifier.of("   ")).toThrow();
      expect(() => UuidProductIdentifier.of("")).toThrow();
    });
  });

  describe("IsbnProductIdentifier", () => {
    it("should accept valid ISBN-10", () => {
      const id = IsbnProductIdentifier.of("0306406152");
      expect(id.idType).toBe("ISBN");
      expect(id.value).toBe("0306406152");
    });

    it("should reject ISBN with wrong length", () => {
      expect(() => IsbnProductIdentifier.of("12345")).toThrow("ISBN must be 10 characters");
    });

    it("should reject ISBN with invalid check digit", () => {
      expect(() => IsbnProductIdentifier.of("0306406151")).toThrow("Invalid ISBN-10 check digit");
    });
  });

  describe("GtinProductIdentifier", () => {
    it("should accept valid GTIN-13", () => {
      const id = GtinProductIdentifier.of("5901234123457");
      expect(id.idType).toBe("GTIN");
      expect(id.value).toBe("5901234123457");
    });

    it("should accept valid GTIN-8", () => {
      const id = GtinProductIdentifier.of("96385074");
      expect(id.idType).toBe("GTIN");
    });

    it("should reject GTIN with invalid length", () => {
      expect(() => GtinProductIdentifier.of("12345")).toThrow();
    });

    it("should reject GTIN with non-digits", () => {
      expect(() => GtinProductIdentifier.of("1234567890ABC")).toThrow();
    });

    it("should reject GTIN with invalid check digit", () => {
      expect(() => GtinProductIdentifier.of("5901234123456")).toThrow("Invalid GTIN check digit");
    });
  });

  describe("parseProductIdentifier", () => {
    it("should parse UUID", () => {
      const id = parseProductIdentifier("UUID", "test-id");
      expect(id.idType).toBe("UUID");
    });

    it("should parse ISBN", () => {
      const id = parseProductIdentifier("ISBN", "0306406152");
      expect(id.idType).toBe("ISBN");
    });

    it("should parse GTIN", () => {
      const id = parseProductIdentifier("GTIN", "5901234123457");
      expect(id.idType).toBe("GTIN");
    });

    it("should be case-insensitive for type", () => {
      const id = parseProductIdentifier("uuid", "test-id");
      expect(id.idType).toBe("UUID");
    });

    it("should reject unknown type", () => {
      expect(() => parseProductIdentifier("UNKNOWN", "val")).toThrow();
    });
  });

  describe("productIdentifierEquals", () => {
    it("should be equal for same type and value", () => {
      const a = UuidProductIdentifier.of("abc");
      const b = UuidProductIdentifier.of("abc");
      expect(productIdentifierEquals(a, b)).toBe(true);
    });

    it("should not be equal for different values", () => {
      const a = UuidProductIdentifier.of("abc");
      const b = UuidProductIdentifier.of("def");
      expect(productIdentifierEquals(a, b)).toBe(false);
    });

    it("should not be equal for different types", () => {
      const a = UuidProductIdentifier.of("0306406152");
      const b = IsbnProductIdentifier.of("0306406152");
      expect(productIdentifierEquals(a, b)).toBe(false);
    });
  });

  describe("productIdentifierKey", () => {
    it("should produce stable key", () => {
      const id = UuidProductIdentifier.of("test");
      expect(productIdentifierKey(id)).toBe("UUID:test");
    });
  });
});
