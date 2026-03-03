import {
  ProductSet,
  SelectedProduct,
  SelectionRule,
  isSelectionSatisfied,
} from "./selection-rule";
import { UuidProductIdentifier } from "../value-objects/product-identifier";

describe("SelectionRule", () => {
  const productA = UuidProductIdentifier.of("product-a");
  const productB = UuidProductIdentifier.of("product-b");
  const productC = UuidProductIdentifier.of("product-c");
  const productD = UuidProductIdentifier.of("product-d");

  const setAB = ProductSet.of("AB", productA, productB);
  const setCD = ProductSet.of("CD", productC, productD);

  describe("isSubsetOf", () => {
    it("should satisfy when count is in range", () => {
      const rule = SelectionRule.isSubsetOf(setAB, 1, 2);
      const selection = [new SelectedProduct(productA, 1)];
      expect(isSelectionSatisfied(rule, selection)).toBe(true);
    });

    it("should satisfy when count equals max", () => {
      const rule = SelectionRule.isSubsetOf(setAB, 1, 2);
      const selection = [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productB, 1),
      ];
      expect(isSelectionSatisfied(rule, selection)).toBe(true);
    });

    it("should not satisfy when count < min", () => {
      const rule = SelectionRule.isSubsetOf(setAB, 1, 2);
      const selection: SelectedProduct[] = [];
      expect(isSelectionSatisfied(rule, selection)).toBe(false);
    });

    it("should not satisfy when count > max", () => {
      const rule = SelectionRule.isSubsetOf(setAB, 1, 1);
      const selection = [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productB, 1),
      ];
      expect(isSelectionSatisfied(rule, selection)).toBe(false);
    });

    it("should ignore products not in the set", () => {
      const rule = SelectionRule.isSubsetOf(setAB, 1, 1);
      const selection = [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productC, 5), // not in set AB
      ];
      expect(isSelectionSatisfied(rule, selection)).toBe(true);
    });

    it("should sum quantities", () => {
      const rule = SelectionRule.isSubsetOf(setAB, 2, 3);
      const selection = [new SelectedProduct(productA, 2)];
      expect(isSelectionSatisfied(rule, selection)).toBe(true);
    });
  });

  describe("single", () => {
    it("should require exactly 1", () => {
      const rule = SelectionRule.single(setAB);
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productA, 1)])).toBe(true);
      expect(isSelectionSatisfied(rule, [])).toBe(false);
      expect(isSelectionSatisfied(rule, [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productB, 1),
      ])).toBe(false);
    });
  });

  describe("optional", () => {
    it("should allow 0 or 1", () => {
      const rule = SelectionRule.optional(setAB);
      expect(isSelectionSatisfied(rule, [])).toBe(true);
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productA, 1)])).toBe(true);
      expect(isSelectionSatisfied(rule, [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productB, 1),
      ])).toBe(false);
    });
  });

  describe("required", () => {
    it("should require at least 1", () => {
      const rule = SelectionRule.required(setAB);
      expect(isSelectionSatisfied(rule, [])).toBe(false);
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productA, 1)])).toBe(true);
      expect(isSelectionSatisfied(rule, [
        new SelectedProduct(productA, 2),
        new SelectedProduct(productB, 3),
      ])).toBe(true);
    });
  });

  describe("and", () => {
    it("should require all rules to be satisfied", () => {
      const rule = SelectionRule.and(
        SelectionRule.single(setAB),
        SelectionRule.single(setCD),
      );
      const selection = [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productC, 1),
      ];
      expect(isSelectionSatisfied(rule, selection)).toBe(true);
    });

    it("should fail when any rule fails", () => {
      const rule = SelectionRule.and(
        SelectionRule.single(setAB),
        SelectionRule.single(setCD),
      );
      const selection = [new SelectedProduct(productA, 1)];
      expect(isSelectionSatisfied(rule, selection)).toBe(false);
    });
  });

  describe("or", () => {
    it("should require at least one rule to be satisfied", () => {
      const rule = SelectionRule.or(
        SelectionRule.single(setAB),
        SelectionRule.single(setCD),
      );
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productA, 1)])).toBe(true);
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productC, 1)])).toBe(true);
    });

    it("should fail when no rule is satisfied", () => {
      const rule = SelectionRule.or(
        SelectionRule.single(setAB),
        SelectionRule.single(setCD),
      );
      expect(isSelectionSatisfied(rule, [])).toBe(false);
    });
  });

  describe("not", () => {
    it("should negate the inner rule", () => {
      const rule = SelectionRule.not(SelectionRule.single(setAB));
      expect(isSelectionSatisfied(rule, [])).toBe(true);
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productA, 1)])).toBe(false);
    });
  });

  describe("ifThen (conditional)", () => {
    it("should enforce then-rules when condition is met", () => {
      const rule = SelectionRule.ifThen(
        SelectionRule.required(setAB),
        SelectionRule.required(setCD),
      );
      // condition met (A selected) → must also select from CD
      expect(isSelectionSatisfied(rule, [
        new SelectedProduct(productA, 1),
        new SelectedProduct(productC, 1),
      ])).toBe(true);

      // condition met but CD not selected → fail
      expect(isSelectionSatisfied(rule, [
        new SelectedProduct(productA, 1),
      ])).toBe(false);
    });

    it("should pass when condition is not met", () => {
      const rule = SelectionRule.ifThen(
        SelectionRule.required(setAB),
        SelectionRule.required(setCD),
      );
      // condition not met (no A/B selected) → auto-pass
      expect(isSelectionSatisfied(rule, [new SelectedProduct(productC, 1)])).toBe(true);
      expect(isSelectionSatisfied(rule, [])).toBe(true);
    });
  });
});

describe("ProductSet", () => {
  const productA = UuidProductIdentifier.of("a");
  const productB = UuidProductIdentifier.of("b");

  it("should contain products", () => {
    const set = ProductSet.of("test", productA, productB);
    expect(set.contains(productA)).toBe(true);
    expect(set.contains(productB)).toBe(true);
    expect(set.contains(UuidProductIdentifier.of("c"))).toBe(false);
  });

  it("should create single-product set", () => {
    const set = ProductSet.singleOf("single", productA);
    expect(set.contains(productA)).toBe(true);
    expect(set.name).toBe("single");
  });

  it("should reject empty set", () => {
    expect(() => new ProductSet("empty", [])).toThrow();
  });

  it("should reject blank name", () => {
    expect(() => new ProductSet("", [productA])).toThrow();
  });
});

describe("SelectedProduct", () => {
  it("should create valid selection", () => {
    const id = UuidProductIdentifier.of("p1");
    const sp = new SelectedProduct(id, 3);
    expect(sp.productId).toBe(id);
    expect(sp.quantity).toBe(3);
  });

  it("should reject non-positive quantity", () => {
    const id = UuidProductIdentifier.of("p1");
    expect(() => new SelectedProduct(id, 0)).toThrow();
    expect(() => new SelectedProduct(id, -1)).toThrow();
  });
});
