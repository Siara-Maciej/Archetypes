export class Result<E, T> {
  private constructor(
    private readonly error: E | null,
    private readonly value: T | null,
    private readonly ok: boolean,
  ) {}

  static success<E, T>(value: T): Result<E, T> {
    return new Result<E, T>(null, value, true);
  }

  static failure<E, T>(error: E): Result<E, T> {
    return new Result<E, T>(error, null, false);
  }

  isSuccess(): boolean {
    return this.ok;
  }

  isFailure(): boolean {
    return !this.ok;
  }

  getValue(): T {
    if (!this.ok) throw new Error('Cannot get value from failure result');
    return this.value as T;
  }

  getError(): E {
    if (this.ok) throw new Error('Cannot get error from success result');
    return this.error as E;
  }

  map<U>(fn: (value: T) => U): Result<E, U> {
    if (this.ok) return Result.success(fn(this.value as T));
    return Result.failure(this.error as E);
  }
}
