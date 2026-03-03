import {
  AllowedValuesConstraint,
  NumericRangeConstraint,
  DecimalRangeConstraint,
  DateRangeConstraint,
  RegexConstraint,
  UnconstrainedConstraint,
} from "./feature-value-constraint";
import { FeatureValueType } from "./feature-value-type";

describe("FeatureValueConstraint", () => {
  describe("AllowedValuesConstraint", () => {
    const constraint = AllowedValuesConstraint.of("red", "blue", "green");

    it("should accept allowed values", () => {
      expect(constraint.isValid("red")).toBe(true);
      expect(constraint.isValid("blue")).toBe(true);
      expect(constraint.isValid("green")).toBe(true);
    });

    it("should reject disallowed values", () => {
      expect(constraint.isValid("yellow")).toBe(false);
      expect(constraint.isValid("")).toBe(false);
    });

    it("should reject non-string values", () => {
      expect(constraint.isValid(42)).toBe(false);
      expect(constraint.isValid(true)).toBe(false);
    });

    it("should have TEXT value type", () => {
      expect(constraint.valueType).toBe(FeatureValueType.TEXT);
    });

    it("should have ALLOWED_VALUES constraint type", () => {
      expect(constraint.constraintType).toBe("ALLOWED_VALUES");
    });

    it("should describe itself", () => {
      expect(constraint.desc()).toContain("one of");
      expect(constraint.desc()).toContain("red");
    });

    it("should parse from string", () => {
      expect(constraint.fromString("red")).toBe("red");
    });

    it("should reject invalid string in fromString", () => {
      expect(() => constraint.fromString("yellow")).toThrow();
    });

    it("should reject empty allowed values", () => {
      expect(() => AllowedValuesConstraint.of()).toThrow();
    });
  });

  describe("NumericRangeConstraint", () => {
    const constraint = NumericRangeConstraint.between(1, 100);

    it("should accept values in range", () => {
      expect(constraint.isValid(1)).toBe(true);
      expect(constraint.isValid(50)).toBe(true);
      expect(constraint.isValid(100)).toBe(true);
    });

    it("should reject values outside range", () => {
      expect(constraint.isValid(0)).toBe(false);
      expect(constraint.isValid(101)).toBe(false);
      expect(constraint.isValid(-1)).toBe(false);
    });

    it("should reject non-integers", () => {
      expect(constraint.isValid(1.5)).toBe(false);
      expect(constraint.isValid("42")).toBe(false);
    });

    it("should have INTEGER value type", () => {
      expect(constraint.valueType).toBe(FeatureValueType.INTEGER);
    });

    it("should parse from string", () => {
      expect(constraint.fromString("50")).toBe(50);
    });

    it("should reject out-of-range string", () => {
      expect(() => constraint.fromString("200")).toThrow();
    });

    it("should reject min > max", () => {
      expect(() => NumericRangeConstraint.between(100, 1)).toThrow();
    });

    it("should describe itself", () => {
      expect(constraint.desc()).toBe("integer between 1 and 100");
    });
  });

  describe("DecimalRangeConstraint", () => {
    const constraint = DecimalRangeConstraint.between(0.5, 100.0);

    it("should accept values in range", () => {
      expect(constraint.isValid(0.5)).toBe(true);
      expect(constraint.isValid(50.5)).toBe(true);
      expect(constraint.isValid(100.0)).toBe(true);
    });

    it("should reject values outside range", () => {
      expect(constraint.isValid(0.4)).toBe(false);
      expect(constraint.isValid(100.1)).toBe(false);
    });

    it("should reject non-numbers", () => {
      expect(constraint.isValid("50")).toBe(false);
      expect(constraint.isValid(true)).toBe(false);
    });

    it("should have DECIMAL value type", () => {
      expect(constraint.valueType).toBe(FeatureValueType.DECIMAL);
    });

    it("should create from string min/max", () => {
      const c = DecimalRangeConstraint.of("0.5", "100.0");
      expect(c.isValid(0.5)).toBe(true);
      expect(c.isValid(100.0)).toBe(true);
    });

    it("should parse from string", () => {
      expect(constraint.fromString("50.5")).toBe(50.5);
    });

    it("should reject min > max", () => {
      expect(() => DecimalRangeConstraint.between(100, 1)).toThrow();
    });
  });

  describe("DateRangeConstraint", () => {
    const constraint = DateRangeConstraint.between("2024-01-01", "2024-12-31");

    it("should accept dates in range", () => {
      expect(constraint.isValid("2024-01-01")).toBe(true);
      expect(constraint.isValid("2024-06-15")).toBe(true);
      expect(constraint.isValid("2024-12-31")).toBe(true);
    });

    it("should reject dates outside range", () => {
      expect(constraint.isValid("2023-12-31")).toBe(false);
      expect(constraint.isValid("2025-01-01")).toBe(false);
    });

    it("should reject non-date values", () => {
      expect(constraint.isValid("not-a-date")).toBe(false);
      expect(constraint.isValid(42)).toBe(false);
    });

    it("should have DATE value type", () => {
      expect(constraint.valueType).toBe(FeatureValueType.DATE);
    });

    it("should parse from string", () => {
      expect(constraint.fromString("2024-06-15")).toBe("2024-06-15");
    });

    it("should reject out-of-range date string", () => {
      expect(() => constraint.fromString("2025-01-01")).toThrow();
    });

    it("should reject from > to", () => {
      expect(() => DateRangeConstraint.between("2024-12-31", "2024-01-01")).toThrow();
    });
  });

  describe("RegexConstraint", () => {
    const constraint = RegexConstraint.of("^[A-Z]{2}-\\d{4}$");

    it("should accept matching values", () => {
      expect(constraint.isValid("AB-1234")).toBe(true);
      expect(constraint.isValid("XY-0000")).toBe(true);
    });

    it("should reject non-matching values", () => {
      expect(constraint.isValid("ab-1234")).toBe(false);
      expect(constraint.isValid("ABC-1234")).toBe(false);
      expect(constraint.isValid("AB-12")).toBe(false);
    });

    it("should reject non-string values", () => {
      expect(constraint.isValid(42)).toBe(false);
    });

    it("should have TEXT value type", () => {
      expect(constraint.valueType).toBe(FeatureValueType.TEXT);
    });

    it("should store pattern string", () => {
      expect(constraint.patternString).toBe("^[A-Z]{2}-\\d{4}$");
    });

    it("should parse from string", () => {
      expect(constraint.fromString("AB-1234")).toBe("AB-1234");
    });

    it("should reject invalid string in fromString", () => {
      expect(() => constraint.fromString("nope")).toThrow();
    });

    it("should reject blank pattern", () => {
      expect(() => RegexConstraint.of("")).toThrow();
    });
  });

  describe("UnconstrainedConstraint", () => {
    it("should accept any string for TEXT", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.TEXT);
      expect(c.isValid("anything")).toBe(true);
      expect(c.isValid("")).toBe(true);
      expect(c.isValid(42)).toBe(false);
    });

    it("should accept any integer for INTEGER", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.INTEGER);
      expect(c.isValid(42)).toBe(true);
      expect(c.isValid(0)).toBe(true);
      expect(c.isValid(-100)).toBe(true);
      expect(c.isValid(3.14)).toBe(false);
    });

    it("should accept any number for DECIMAL", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.DECIMAL);
      expect(c.isValid(3.14)).toBe(true);
      expect(c.isValid(42)).toBe(true);
      expect(c.isValid("nope")).toBe(false);
    });

    it("should accept booleans for BOOLEAN", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.BOOLEAN);
      expect(c.isValid(true)).toBe(true);
      expect(c.isValid(false)).toBe(true);
      expect(c.isValid("true")).toBe(false);
    });

    it("should accept ISO dates for DATE", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.DATE);
      expect(c.isValid("2024-01-15")).toBe(true);
      expect(c.isValid("not-a-date")).toBe(false);
    });

    it("should have UNCONSTRAINED constraint type", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.TEXT);
      expect(c.constraintType).toBe("UNCONSTRAINED");
    });

    it("should parse from string", () => {
      const c = new UnconstrainedConstraint(FeatureValueType.INTEGER);
      expect(c.fromString("42")).toBe(42);
    });
  });
});
