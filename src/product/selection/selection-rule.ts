/**
 * SelectionRule — rules for how products can be selected within a package.
 *
 * WHY: A PackageType (e.g., "Laptop Bundle") needs to define not just WHAT
 *      products are available, but HOW MANY the customer must/can choose.
 *      "Select exactly 1 memory option", "Select 0-2 accessories",
 *      "If gaming laptop then dedicated GPU is required".
 *
 * WHAT:
 *   ProductSet     — a named pool of available products (the "menu")
 *   SelectedProduct — a customer's choice (product + quantity)
 *   SelectionRule  — a constraint on valid selections
 *
 * RULE TYPES:
 *   isSubsetOf(set, min, max)  — select between min and max items from set
 *   single(set)                — exactly 1 from set (shortcut for isSubsetOf 1,1)
 *   optional(set)              — 0 or 1 from set (shortcut for isSubsetOf 0,1)
 *   required(set)              — at least 1 from set (shortcut for isSubsetOf 1,∞)
 *   and(...rules)              — ALL rules must be satisfied
 *   or(...rules)               — at least ONE rule must be satisfied
 *   not(rule)                  — rule must NOT be satisfied
 *   ifThen(condition, ...then) — IF condition is met THEN all then-rules must hold
 *
 * This is the SPECIFICATION PATTERN applied to package configuration rules.
 */

import { checkArgument } from "../shared/preconditions";
import {
  ProductIdentifier,
  productIdentifierKey,
} from "../value-objects/product-identifier";

// ─── ProductSet ───────────────────────────────────────────────────────────────

/**
 * A named collection of products available for selection in a package.
 * Think of it as a "category" or "slot" in the package.
 *
 * Example: "Memory Options" containing {4GB RAM, 8GB RAM, 16GB RAM}.
 */
export class ProductSet {
  readonly name: string;
  private readonly productKeys: ReadonlySet<string>;
  readonly products: readonly ProductIdentifier[];

  constructor(name: string, products: ProductIdentifier[]) {
    checkArgument(
      name != null && name.trim().length > 0,
      "ProductSet name must be defined",
    );
    checkArgument(
      products != null && products.length > 0,
      "ProductSet must contain at least one product",
    );
    this.name = name;
    this.products = [...products];
    this.productKeys = new Set(products.map(productIdentifierKey));
  }

  static singleOf(name: string, id: ProductIdentifier): ProductSet {
    return new ProductSet(name, [id]);
  }

  static of(name: string, ...ids: ProductIdentifier[]): ProductSet {
    return new ProductSet(name, ids);
  }

  contains(productId: ProductIdentifier): boolean {
    return this.productKeys.has(productIdentifierKey(productId));
  }

  toString(): string {
    return `ProductSet{name='${this.name}', products=${this.products.length}}`;
  }
}

// ─── SelectedProduct ──────────────────────────────────────────────────────────

/**
 * Represents a product selected by the customer with a quantity.
 * Used for validating package selections against selection rules.
 */
export class SelectedProduct {
  readonly productId: ProductIdentifier;
  readonly quantity: number;

  constructor(productId: ProductIdentifier, quantity: number) {
    checkArgument(productId != null, "ProductId must be defined");
    checkArgument(quantity > 0, "Quantity must be > 0");
    this.productId = productId;
    this.quantity = quantity;
  }
}

// ─── SelectionRule (Discriminated Union) ──────────────────────────────────────

export type SelectionRule =
  | IsSubsetOfRule
  | AndRule
  | OrRule
  | NotRule
  | ConditionalRule;

interface IsSubsetOfRule {
  readonly kind: "isSubsetOf";
  readonly sourceSet: ProductSet;
  readonly min: number;
  readonly max: number;
}

interface AndRule {
  readonly kind: "and";
  readonly rules: readonly SelectionRule[];
}

interface OrRule {
  readonly kind: "or";
  readonly rules: readonly SelectionRule[];
}

interface NotRule {
  readonly kind: "not";
  readonly rule: SelectionRule;
}

interface ConditionalRule {
  readonly kind: "conditional";
  readonly condition: SelectionRule;
  readonly thenRules: readonly SelectionRule[];
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

/** Evaluates whether a selection satisfies a rule. */
export function isSelectionSatisfied(
  rule: SelectionRule,
  selection: SelectedProduct[],
): boolean {
  switch (rule.kind) {
    case "isSubsetOf": {
      const count = selection
        .filter((s) => rule.sourceSet.contains(s.productId))
        .reduce((sum, s) => sum + s.quantity, 0);
      return count >= rule.min && count <= rule.max;
    }

    case "and":
      return rule.rules.every((r) => isSelectionSatisfied(r, selection));

    case "or":
      return rule.rules.some((r) => isSelectionSatisfied(r, selection));

    case "not":
      return !isSelectionSatisfied(rule.rule, selection);

    case "conditional": {
      if (isSelectionSatisfied(rule.condition, selection)) {
        return rule.thenRules.every((r) => isSelectionSatisfied(r, selection));
      }
      return true; // condition not met → rule passes automatically
    }
  }
}

// ─── Factory Functions ────────────────────────────────────────────────────────

export const SelectionRule = {
  /** Select between min and max items from the source set. */
  isSubsetOf(sourceSet: ProductSet, min: number, max: number): SelectionRule {
    checkArgument(sourceSet != null, "ProductSet must be defined");
    checkArgument(min >= 0, "Min must be >= 0");
    checkArgument(max >= min, "Max must be >= min");
    return { kind: "isSubsetOf", sourceSet, min, max };
  },

  /** Exactly 1 from the set (required single choice). */
  single(sourceSet: ProductSet): SelectionRule {
    return SelectionRule.isSubsetOf(sourceSet, 1, 1);
  },

  /** 0 or 1 from the set (optional choice). */
  optional(sourceSet: ProductSet): SelectionRule {
    return SelectionRule.isSubsetOf(sourceSet, 0, 1);
  },

  /** At least 1 from the set (required, any amount). */
  required(sourceSet: ProductSet): SelectionRule {
    return SelectionRule.isSubsetOf(sourceSet, 1, Number.MAX_SAFE_INTEGER);
  },

  /** ALL rules must be satisfied. */
  and(...rules: SelectionRule[]): SelectionRule {
    checkArgument(rules.length > 0, "Rules cannot be empty");
    return { kind: "and", rules };
  },

  /** At least ONE rule must be satisfied. */
  or(...rules: SelectionRule[]): SelectionRule {
    checkArgument(rules.length > 0, "Rules cannot be empty");
    return { kind: "or", rules };
  },

  /** Rule must NOT be satisfied. */
  not(rule: SelectionRule): SelectionRule {
    checkArgument(rule != null, "Rule must be defined");
    return { kind: "not", rule };
  },

  /** IF condition is met THEN all thenRules must hold. */
  ifThen(condition: SelectionRule, ...thenRules: SelectionRule[]): SelectionRule {
    checkArgument(condition != null, "Condition must be defined");
    checkArgument(thenRules.length > 0, "Then rules cannot be empty");
    return { kind: "conditional", condition, thenRules };
  },
} as const;
