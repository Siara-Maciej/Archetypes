import {
  SerialNumber,
  TextualSerialNumber,
  ImeiSerialNumber,
  VinSerialNumber,
} from "./serial-number";

describe("SerialNumber", () => {
  describe("TextualSerialNumber", () => {
    it("should create from valid string", () => {
      const sn = TextualSerialNumber.of("ABC-123");
      expect(sn.serialType).toBe("TEXTUAL");
      expect(sn.value).toBe("ABC-123");
    });

    it("should reject blank string", () => {
      expect(() => TextualSerialNumber.of("")).toThrow();
      expect(() => TextualSerialNumber.of("   ")).toThrow();
    });
  });

  describe("ImeiSerialNumber", () => {
    // Valid IMEI: 490154203237518 passes Luhn
    it("should create from valid IMEI", () => {
      const sn = ImeiSerialNumber.of("490154203237518");
      expect(sn.serialType).toBe("IMEI");
      expect(sn.value).toBe("490154203237518");
    });

    it("should normalize IMEI (remove spaces/dashes)", () => {
      const sn = ImeiSerialNumber.of("49-0154-2032-37518");
      expect(sn.value).toBe("490154203237518");
    });

    it("should reject IMEI with wrong length", () => {
      expect(() => ImeiSerialNumber.of("12345")).toThrow("15 digits");
    });

    it("should reject IMEI with invalid Luhn", () => {
      expect(() => ImeiSerialNumber.of("490154203237519")).toThrow("Luhn");
    });
  });

  describe("VinSerialNumber", () => {
    // Valid VIN format: 17 chars, no I/O/Q
    it("should create from valid VIN", () => {
      const sn = VinSerialNumber.of("1HGBH41JXMN109186");
      expect(sn.serialType).toBe("VIN");
      expect(sn.value).toBe("1HGBH41JXMN109186");
    });

    it("should normalize VIN to uppercase", () => {
      const sn = VinSerialNumber.of("1hgbh41jxmn109186");
      expect(sn.value).toBe("1HGBH41JXMN109186");
    });

    it("should reject VIN with wrong length", () => {
      expect(() => VinSerialNumber.of("ABC123")).toThrow("17 characters");
    });

    it("should reject VIN with I, O, or Q", () => {
      expect(() => VinSerialNumber.of("1HGBH41IXMN109186")).toThrow();
      expect(() => VinSerialNumber.of("1HGBH41OXMN109186")).toThrow();
      expect(() => VinSerialNumber.of("1HGBH41QXMN109186")).toThrow();
    });
  });

  describe("SerialNumber factory", () => {
    it("should create textual via of()", () => {
      const sn = SerialNumber.of("test");
      expect(sn.serialType).toBe("TEXTUAL");
    });

    it("should create VIN via vin()", () => {
      const sn = SerialNumber.vin("1HGBH41JXMN109186");
      expect(sn.serialType).toBe("VIN");
    });

    it("should create IMEI via imei()", () => {
      const sn = SerialNumber.imei("490154203237518");
      expect(sn.serialType).toBe("IMEI");
    });
  });
});
