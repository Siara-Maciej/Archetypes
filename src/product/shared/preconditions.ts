/**
 * Preconditions — defensive programming utilities.
 *
 * WHY: Domain objects must enforce their own invariants at construction time.
 *      Invalid state should be impossible to represent — "make illegal states
 *      unrepresentable". This is the foundation of a rich domain model.
 *
 * WHAT: A single `checkArgument` helper that throws `IllegalArgumentError`
 *       when a precondition is violated. Used in constructors and factory
 *       methods across the entire domain layer.
 *
 * HOW: Inspired by Guava's Preconditions / Java's Objects.requireNonNull.
 *      Keeps validation code concise and consistent.
 */

/**
 * Custom error type for domain invariant violations.
 * Separate from generic Error so callers can distinguish domain validation
 * failures from infrastructure errors.
 */
export class IllegalArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalArgumentError";
  }
}

/**
 * Asserts that a condition is true; throws IllegalArgumentError otherwise.
 *
 * @param condition - the boolean expression to check
 * @param message   - descriptive message explaining what went wrong
 *
 * @example
 * checkArgument(name.length > 0, "Product name must not be blank");
 */
export function checkArgument(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new IllegalArgumentError(message);
  }
}
