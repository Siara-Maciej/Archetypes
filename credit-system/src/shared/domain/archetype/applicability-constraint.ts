/**
 * ApplicabilityConstraint — determines if a product is applicable in a given context.
 *
 * Composable boolean algebra (Specification Pattern):
 *   equalsTo("country", "PL"), between("age", 18, 65), and(...), or(...), not(...)
 *
 * ApplicabilityContext is a simple key-value map of the evaluation situation.
 */

// ─── ApplicabilityContext ─────────────────────────────────────────────────────

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

  has(key: string): boolean {
    return this.parameters.has(key);
  }

  asRecord(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.parameters) result[k] = v;
    return result;
  }
}

// ─── Constraint Types (Discriminated Union) ───────────────────────────────────

export type ApplicabilityConstraint =
  | { readonly kind: 'alwaysTrue' }
  | { readonly kind: 'equals'; readonly parameterName: string; readonly expectedValue: string }
  | { readonly kind: 'in'; readonly parameterName: string; readonly allowedValues: ReadonlySet<string> }
  | { readonly kind: 'greaterThan'; readonly parameterName: string; readonly threshold: number }
  | { readonly kind: 'lessThan'; readonly parameterName: string; readonly threshold: number }
  | { readonly kind: 'between'; readonly parameterName: string; readonly min: number; readonly max: number }
  | { readonly kind: 'and'; readonly constraints: readonly ApplicabilityConstraint[] }
  | { readonly kind: 'or'; readonly constraints: readonly ApplicabilityConstraint[] }
  | { readonly kind: 'not'; readonly constraint: ApplicabilityConstraint };

// ─── Evaluation ───────────────────────────────────────────────────────────────

export function isSatisfiedBy(
  constraint: ApplicabilityConstraint,
  context: ApplicabilityContext,
): boolean {
  switch (constraint.kind) {
    case 'alwaysTrue':
      return true;
    case 'equals': {
      const value = context.get(constraint.parameterName);
      return value != null && value === constraint.expectedValue;
    }
    case 'in': {
      const value = context.get(constraint.parameterName);
      return value != null && constraint.allowedValues.has(value);
    }
    case 'greaterThan': {
      const value = context.get(constraint.parameterName);
      if (value == null) return false;
      const num = parseInt(value, 10);
      return !isNaN(num) && num > constraint.threshold;
    }
    case 'lessThan': {
      const value = context.get(constraint.parameterName);
      if (value == null) return false;
      const num = parseInt(value, 10);
      return !isNaN(num) && num < constraint.threshold;
    }
    case 'between': {
      const value = context.get(constraint.parameterName);
      if (value == null) return false;
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= constraint.min && num <= constraint.max;
    }
    case 'and':
      return constraint.constraints.every((c) => isSatisfiedBy(c, context));
    case 'or':
      return constraint.constraints.some((c) => isSatisfiedBy(c, context));
    case 'not':
      return !isSatisfiedBy(constraint.constraint, context);
  }
}

// ─── Factory Functions ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ApplicabilityConstraint = {
  alwaysTrue(): ApplicabilityConstraint {
    return { kind: 'alwaysTrue' };
  },
  equalsTo(parameterName: string, expectedValue: string): ApplicabilityConstraint {
    return { kind: 'equals', parameterName, expectedValue };
  },
  in(parameterName: string, ...allowedValues: string[]): ApplicabilityConstraint {
    return { kind: 'in', parameterName, allowedValues: new Set(allowedValues) };
  },
  greaterThan(parameterName: string, threshold: number): ApplicabilityConstraint {
    return { kind: 'greaterThan', parameterName, threshold };
  },
  lessThan(parameterName: string, threshold: number): ApplicabilityConstraint {
    return { kind: 'lessThan', parameterName, threshold };
  },
  between(parameterName: string, min: number, max: number): ApplicabilityConstraint {
    return { kind: 'between', parameterName, min, max };
  },
  and(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
    return { kind: 'and', constraints };
  },
  or(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
    return { kind: 'or', constraints };
  },
  not(constraint: ApplicabilityConstraint): ApplicabilityConstraint {
    return { kind: 'not', constraint };
  },
} as const;
