import { checkArgument, IllegalArgumentError } from "./preconditions";

describe("Preconditions", () => {
  describe("checkArgument", () => {
    it("should pass when condition is true", () => {
      expect(() => checkArgument(true, "ok")).not.toThrow();
    });

    it("should throw IllegalArgumentError when condition is false", () => {
      expect(() => checkArgument(false, "bad")).toThrow(IllegalArgumentError);
      expect(() => checkArgument(false, "bad")).toThrow("bad");
    });

    it("should include message in error", () => {
      try {
        checkArgument(false, "custom message");
        fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(IllegalArgumentError);
        expect((e as Error).message).toBe("custom message");
        expect((e as Error).name).toBe("IllegalArgumentError");
      }
    });
  });
});
