import { Result } from "./result";

describe("Result", () => {
  it("should create a success result", () => {
    const result = Result.success(42);
    expect(Result.isSuccess(result)).toBe(true);
    expect(Result.isFailure(result)).toBe(false);
    expect(Result.getOrThrow(result)).toBe(42);
  });

  it("should create a failure result", () => {
    const result = Result.failure("error");
    expect(Result.isFailure(result)).toBe(true);
    expect(Result.isSuccess(result)).toBe(false);
    expect(Result.getFailure(result)).toBe("error");
  });

  it("should throw on getOrThrow for failure", () => {
    const result = Result.failure("boom");
    expect(() => Result.getOrThrow(result)).toThrow("Result is a failure: boom");
  });

  it("should throw on getFailure for success", () => {
    const result = Result.success("ok");
    expect(() => Result.getFailure(result)).toThrow("Result is a success, not a failure");
  });

  it("should discriminate via kind tag", () => {
    const success = Result.success("hello");
    const failure = Result.failure("error");
    expect(success.kind).toBe("success");
    expect(failure.kind).toBe("failure");
  });
});
