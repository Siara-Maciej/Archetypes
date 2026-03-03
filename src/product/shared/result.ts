/**
 * Result — a discriminated union for operation outcomes.
 *
 * WHY: Facades (application services) need to communicate success or failure
 *      back to the caller without throwing exceptions for expected business
 *      failures. Exceptions should be reserved for truly exceptional situations
 *      (infrastructure down, programming errors), not for "product not found".
 *
 * WHAT: A Result<E, T> is either:
 *       - Success<T> carrying the produced value, or
 *       - Failure<E> carrying an error description.
 *
 * HOW: Implemented as a discriminated union with a `kind` tag. Pattern matching
 *      via `isSuccess()` / `isFailure()` narrows the type automatically.
 *
 * Inspired by Rust's Result<T, E>, Kotlin's Result, and functional Either type.
 */

interface SuccessResult<T> {
  readonly kind: "success";
  readonly value: T;
}

interface FailureResult<E> {
  readonly kind: "failure";
  readonly error: E;
}

export type Result<E, T> = SuccessResult<T> | FailureResult<E>;

export const Result = {
  /**
   * Creates a successful result carrying the given value.
   */
  success<T>(value: T): Result<never, T> {
    return { kind: "success", value };
  },

  /**
   * Creates a failure result carrying the given error.
   */
  failure<E>(error: E): Result<E, never> {
    return { kind: "failure", error };
  },

  /**
   * Type guard: narrows Result to SuccessResult.
   */
  isSuccess<E, T>(result: Result<E, T>): result is SuccessResult<T> {
    return result.kind === "success";
  },

  /**
   * Type guard: narrows Result to FailureResult.
   */
  isFailure<E, T>(result: Result<E, T>): result is FailureResult<E> {
    return result.kind === "failure";
  },

  /**
   * Extracts the success value or throws if the result is a failure.
   */
  getOrThrow<E, T>(result: Result<E, T>): T {
    if (result.kind === "success") return result.value;
    throw new Error(`Result is a failure: ${String(result.error)}`);
  },

  /**
   * Extracts the failure error or throws if the result is a success.
   */
  getFailure<E, T>(result: Result<E, T>): E {
    if (result.kind === "failure") return result.error;
    throw new Error("Result is a success, not a failure");
  },
} as const;
