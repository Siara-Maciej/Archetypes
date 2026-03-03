import {
  ApplicabilityContext,
  ApplicabilityConstraint,
  isSatisfiedBy,
} from "./applicability-constraint";

describe("ApplicabilityConstraint", () => {
  describe("alwaysTrue", () => {
    it("should always be satisfied", () => {
      const constraint = ApplicabilityConstraint.alwaysTrue();
      expect(isSatisfiedBy(constraint, ApplicabilityContext.empty())).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ anything: "value" }))).toBe(true);
    });
  });

  describe("equalsTo", () => {
    const constraint = ApplicabilityConstraint.equalsTo("country", "PL");

    it("should be satisfied when parameter matches", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "PL" }))).toBe(true);
    });

    it("should not be satisfied when parameter differs", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "DE" }))).toBe(false);
    });

    it("should not be satisfied when parameter is missing", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.empty())).toBe(false);
    });
  });

  describe("in", () => {
    const constraint = ApplicabilityConstraint.in("channel", "web", "mobile", "api");

    it("should be satisfied when parameter is in set", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ channel: "web" }))).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ channel: "mobile" }))).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ channel: "api" }))).toBe(true);
    });

    it("should not be satisfied when parameter is not in set", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ channel: "email" }))).toBe(false);
    });

    it("should not be satisfied when parameter is missing", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.empty())).toBe(false);
    });
  });

  describe("greaterThan", () => {
    const constraint = ApplicabilityConstraint.greaterThan("age", 18);

    it("should be satisfied when value > threshold", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "25" }))).toBe(true);
    });

    it("should not be satisfied when value equals threshold", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "18" }))).toBe(false);
    });

    it("should not be satisfied when value < threshold", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "15" }))).toBe(false);
    });

    it("should not be satisfied when parameter is missing", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.empty())).toBe(false);
    });

    it("should not be satisfied for non-numeric value", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "abc" }))).toBe(false);
    });
  });

  describe("lessThan", () => {
    const constraint = ApplicabilityConstraint.lessThan("age", 65);

    it("should be satisfied when value < threshold", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "30" }))).toBe(true);
    });

    it("should not be satisfied when value equals threshold", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "65" }))).toBe(false);
    });

    it("should not be satisfied when value > threshold", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "70" }))).toBe(false);
    });
  });

  describe("between", () => {
    const constraint = ApplicabilityConstraint.between("age", 18, 65);

    it("should be satisfied for values in range", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "18" }))).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "40" }))).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "65" }))).toBe(true);
    });

    it("should not be satisfied for values outside range", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "17" }))).toBe(false);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ age: "66" }))).toBe(false);
    });
  });

  describe("and", () => {
    const constraint = ApplicabilityConstraint.and(
      ApplicabilityConstraint.equalsTo("country", "PL"),
      ApplicabilityConstraint.greaterThan("age", 18),
    );

    it("should be satisfied when all constraints match", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "PL", age: "25" }))).toBe(true);
    });

    it("should not be satisfied when any constraint fails", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "PL", age: "15" }))).toBe(false);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "DE", age: "25" }))).toBe(false);
    });
  });

  describe("or", () => {
    const constraint = ApplicabilityConstraint.or(
      ApplicabilityConstraint.equalsTo("country", "PL"),
      ApplicabilityConstraint.equalsTo("country", "DE"),
    );

    it("should be satisfied when any constraint matches", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "PL" }))).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "DE" }))).toBe(true);
    });

    it("should not be satisfied when none match", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "US" }))).toBe(false);
    });
  });

  describe("not", () => {
    const constraint = ApplicabilityConstraint.not(
      ApplicabilityConstraint.equalsTo("country", "US"),
    );

    it("should negate the inner constraint", () => {
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "PL" }))).toBe(true);
      expect(isSatisfiedBy(constraint, ApplicabilityContext.of({ country: "US" }))).toBe(false);
    });
  });

  describe("complex composition", () => {
    const constraint = ApplicabilityConstraint.and(
      ApplicabilityConstraint.or(
        ApplicabilityConstraint.equalsTo("country", "PL"),
        ApplicabilityConstraint.equalsTo("country", "DE"),
      ),
      ApplicabilityConstraint.between("age", 18, 65),
      ApplicabilityConstraint.in("channel", "web", "mobile"),
    );

    it("should satisfy all conditions", () => {
      expect(
        isSatisfiedBy(
          constraint,
          ApplicabilityContext.of({ country: "PL", age: "30", channel: "web" }),
        ),
      ).toBe(true);
    });

    it("should fail when country is wrong", () => {
      expect(
        isSatisfiedBy(
          constraint,
          ApplicabilityContext.of({ country: "US", age: "30", channel: "web" }),
        ),
      ).toBe(false);
    });

    it("should fail when age is out of range", () => {
      expect(
        isSatisfiedBy(
          constraint,
          ApplicabilityContext.of({ country: "PL", age: "16", channel: "web" }),
        ),
      ).toBe(false);
    });

    it("should fail when channel is wrong", () => {
      expect(
        isSatisfiedBy(
          constraint,
          ApplicabilityContext.of({ country: "PL", age: "30", channel: "email" }),
        ),
      ).toBe(false);
    });
  });
});

describe("ApplicabilityContext", () => {
  it("should create from record", () => {
    const ctx = ApplicabilityContext.of({ a: "1", b: "2" });
    expect(ctx.get("a")).toBe("1");
    expect(ctx.get("b")).toBe("2");
  });

  it("should return undefined for missing keys", () => {
    const ctx = ApplicabilityContext.empty();
    expect(ctx.get("missing")).toBeUndefined();
  });

  it("should return default value", () => {
    const ctx = ApplicabilityContext.empty();
    expect(ctx.getOrDefault("missing", "default")).toBe("default");
  });

  it("should check for key existence", () => {
    const ctx = ApplicabilityContext.of({ key: "value" });
    expect(ctx.has("key")).toBe(true);
    expect(ctx.has("missing")).toBe(false);
  });

  it("should convert to record", () => {
    const ctx = ApplicabilityContext.of({ a: "1" });
    expect(ctx.asRecord()).toEqual({ a: "1" });
  });
});
