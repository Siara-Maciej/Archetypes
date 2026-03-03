/**
 * ApplicabilityConstraint — determines if a product is applicable in a given context.
 *
 * WHY: Products are not universally available. A mobile plan may only apply in
 *      certain countries, an insurance product only for certain age ranges,
 *      a seasonal promotion only through specific channels. Instead of hardcoding
 *      these rules, we express them as composable constraints.
 *
 * WHAT: A constraint evaluates to true/false against an ApplicabilityContext
 *       (a bag of string key-value pairs representing the current situation).
 *
 * COMPOSITION: Constraints are composable via boolean algebra:
 *   - equalsTo("country", "PL")           — exact match
 *   - in("channel", "web", "mobile")      — membership in set
 *   - greaterThan("age", 18)              — numeric comparison
 *   - lessThan("age", 65)                 — numeric comparison
 *   - between("age", 18, 65)             — numeric range
 *   - and(constraint1, constraint2)       — logical AND
 *   - or(constraint1, constraint2)        — logical OR
 *   - not(constraint)                     — logical NOT
 *   - alwaysTrue()                        — universal applicability
 *
 * This is the SPECIFICATION PATTERN — business rules expressed as first-class
 * composable objects rather than embedded in procedural code.
 *
 * EXAMPLE:
 *   const constraint = ApplicabilityConstraint.and(
 *     ApplicabilityConstraint.equalsTo("country", "PL"),
 *     ApplicabilityConstraint.between("age", 18, 65),
 *     ApplicabilityConstraint.in("channel", "web", "mobile")
 *   );
 *   constraint.isSatisfiedBy(context); // true or false
 */

// ─── ApplicabilityContext ─────────────────────────────────────────────────────

/**
 * Context for evaluating applicability constraints.
 * A simple key-value map representing the situation (country, channel, age, etc.).
 */
export class ApplicabilityContext {
  private readonly parameters: ReadonlyMap<string, string>;

  private constructor(parameters: Map<string, string>) {
    this.parameters = new Map(parameters);
  }

  static empty(): ApplicabilityContext {
    return new ApplicabilityContext(new Map());
  }

  static of(params: Record<string, string>): ApplicabilityContext {
    return new ApplicabilityContext(new Map(Object.entries(params)));
  }

  get(key: string): string | undefined {
    return this.parameters.get(key);
  }

  getOrDefault(key: string, defaultValue: string): string {
    return this.parameters.get(key) ?? defaultValue;
  }

  has(key: string): boolean {
    return this.parameters.has(key);
  }

  asRecord(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.parameters) result[k] = v;
    return result;
  }

  toString(): string {
    return `ApplicabilityContext${JSON.stringify(this.asRecord())}`;
  }
}

// ─── Constraint Types (Discriminated Union) ───────────────────────────────────

export type ApplicabilityConstraint =
  | AlwaysTrueConstraint
  | EqualsConstraint
  | InConstraint
  | GreaterThanConstraint
  | LessThanConstraint
  | BetweenConstraint
  | AndConstraint
  | OrConstraint
  | NotConstraint;

interface AlwaysTrueConstraint {
  readonly kind: "alwaysTrue";
}
interface EqualsConstraint {
  readonly kind: "equals";
  readonly parameterName: string;
  readonly expectedValue: string;
}
interface InConstraint {
  readonly kind: "in";
  readonly parameterName: string;
  readonly allowedValues: ReadonlySet<string>;
}
interface GreaterThanConstraint {
  readonly kind: "greaterThan";
  readonly parameterName: string;
  readonly threshold: number;
}
interface LessThanConstraint {
  readonly kind: "lessThan";
  readonly parameterName: string;
  readonly threshold: number;
}
interface BetweenConstraint {
  readonly kind: "between";
  readonly parameterName: string;
  readonly min: number;
  readonly max: number;
}
interface AndConstraint {
  readonly kind: "and";
  readonly constraints: readonly ApplicabilityConstraint[];
}
interface OrConstraint {
  readonly kind: "or";
  readonly constraints: readonly ApplicabilityConstraint[];
}
interface NotConstraint {
  readonly kind: "not";
  readonly constraint: ApplicabilityConstraint;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

/** Evaluates whether a constraint is satisfied by the given context. */
export function isSatisfiedBy(
  constraint: ApplicabilityConstraint,
  context: ApplicabilityContext,
): boolean {
  switch (constraint.kind) {
    case "alwaysTrue":
      return true;

    case "equals": {
      const value = context.get(constraint.parameterName);
      return value != null && value === constraint.expectedValue;
    }

    case "in": {
      const value = context.get(constraint.parameterName);
      return value != null && constraint.allowedValues.has(value);
    }

    case "greaterThan": {
      const value = context.get(constraint.parameterName);
      if (value == null) return false;
      const num = parseInt(value, 10);
      return !isNaN(num) && num > constraint.threshold;
    }

    case "lessThan": {
      const value = context.get(constraint.parameterName);
      if (value == null) return false;
      const num = parseInt(value, 10);
      return !isNaN(num) && num < constraint.threshold;
    }

    case "between": {
      const value = context.get(constraint.parameterName);
      if (value == null) return false;
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= constraint.min && num <= constraint.max;
    }

    case "and":
      return constraint.constraints.every((c) => isSatisfiedBy(c, context));

    case "or":
      return constraint.constraints.some((c) => isSatisfiedBy(c, context));

    case "not":
      return !isSatisfiedBy(constraint.constraint, context);
  }
}

// ─── Factory Functions ────────────────────────────────────────────────────────

export const ApplicabilityConstraint = {
  alwaysTrue(): ApplicabilityConstraint {
    return { kind: "alwaysTrue" };
  },

  equalsTo(parameterName: string, expectedValue: string): ApplicabilityConstraint {
    return { kind: "equals", parameterName, expectedValue };
  },

  in(parameterName: string, ...allowedValues: string[]): ApplicabilityConstraint {
    return { kind: "in", parameterName, allowedValues: new Set(allowedValues) };
  },

  greaterThan(parameterName: string, threshold: number): ApplicabilityConstraint {
    return { kind: "greaterThan", parameterName, threshold };
  },

  lessThan(parameterName: string, threshold: number): ApplicabilityConstraint {
    return { kind: "lessThan", parameterName, threshold };
  },

  between(parameterName: string, min: number, max: number): ApplicabilityConstraint {
    return { kind: "between", parameterName, min, max };
  },

  and(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
    return { kind: "and", constraints };
  },

  or(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
    return { kind: "or", constraints };
  },

  not(constraint: ApplicabilityConstraint): ApplicabilityConstraint {
    return { kind: "not", constraint };
  },
} as const;
