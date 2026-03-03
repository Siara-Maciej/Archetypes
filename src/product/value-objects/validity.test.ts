import { Validity } from "./validity";

describe("Validity", () => {
  describe("factory methods", () => {
    it("should create always-valid", () => {
      const v = Validity.always();
      expect(v.from).toBeUndefined();
      expect(v.to).toBeUndefined();
    });

    it("should create from-date validity", () => {
      const v = Validity.fromDate("2024-01-01");
      expect(v.from).toBe("2024-01-01");
      expect(v.to).toBeUndefined();
    });

    it("should create until-date validity", () => {
      const v = Validity.until("2024-12-31");
      expect(v.from).toBeUndefined();
      expect(v.to).toBe("2024-12-31");
    });

    it("should create between-dates validity", () => {
      const v = Validity.between("2024-01-01", "2024-12-31");
      expect(v.from).toBe("2024-01-01");
      expect(v.to).toBe("2024-12-31");
    });

    it("should reject between when from > to", () => {
      expect(() => Validity.between("2024-12-31", "2024-01-01")).toThrow();
    });

    it("should allow between when from === to", () => {
      const v = Validity.between("2024-06-15", "2024-06-15");
      expect(v.from).toBe("2024-06-15");
      expect(v.to).toBe("2024-06-15");
    });
  });

  describe("isValidAt", () => {
    it("always-valid should accept any date", () => {
      const v = Validity.always();
      expect(v.isValidAt("2024-06-15")).toBe(true);
      expect(v.isValidAt("2000-01-01")).toBe(true);
      expect(v.isValidAt("2099-12-31")).toBe(true);
    });

    it("from-date should accept dates on or after from", () => {
      const v = Validity.fromDate("2024-03-01");
      expect(v.isValidAt("2024-02-28")).toBe(false);
      expect(v.isValidAt("2024-03-01")).toBe(true);
      expect(v.isValidAt("2024-03-02")).toBe(true);
      expect(v.isValidAt("2025-01-01")).toBe(true);
    });

    it("until-date should accept dates on or before to", () => {
      const v = Validity.until("2024-06-30");
      expect(v.isValidAt("2024-06-29")).toBe(true);
      expect(v.isValidAt("2024-06-30")).toBe(true);
      expect(v.isValidAt("2024-07-01")).toBe(false);
      expect(v.isValidAt("2023-01-01")).toBe(true);
    });

    it("between-dates should accept dates within range", () => {
      const v = Validity.between("2024-03-01", "2024-06-30");
      expect(v.isValidAt("2024-02-28")).toBe(false);
      expect(v.isValidAt("2024-03-01")).toBe(true);
      expect(v.isValidAt("2024-05-15")).toBe(true);
      expect(v.isValidAt("2024-06-30")).toBe(true);
      expect(v.isValidAt("2024-07-01")).toBe(false);
    });

    it("should reject null/undefined date", () => {
      const v = Validity.always();
      expect(v.isValidAt(null as unknown as string)).toBe(false);
    });
  });

  describe("equals", () => {
    it("should be equal for same boundaries", () => {
      expect(Validity.always().equals(Validity.always())).toBe(true);
      expect(
        Validity.between("2024-01-01", "2024-12-31").equals(
          Validity.between("2024-01-01", "2024-12-31"),
        ),
      ).toBe(true);
    });

    it("should not be equal for different boundaries", () => {
      expect(
        Validity.fromDate("2024-01-01").equals(Validity.fromDate("2024-01-02")),
      ).toBe(false);
    });
  });

  describe("toString", () => {
    it("should format always as 'always'", () => {
      expect(Validity.always().toString()).toBe("always");
    });

    it("should format from-date", () => {
      expect(Validity.fromDate("2024-01-01").toString()).toBe("from 2024-01-01");
    });

    it("should format until-date", () => {
      expect(Validity.until("2024-12-31").toString()).toBe("until 2024-12-31");
    });

    it("should format between-dates", () => {
      expect(Validity.between("2024-01-01", "2024-12-31").toString()).toBe(
        "2024-01-01 to 2024-12-31",
      );
    });
  });
});
