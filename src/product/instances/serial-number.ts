/**
 * SerialNumber — unique identifier for a specific product instance.
 *
 * WHY: Different industries use different serial number formats — electronics use
 *      IMEI (15 digits with Luhn check), vehicles use VIN (17 chars), while most
 *      products use simple textual serial numbers. Supporting multiple formats
 *      with validation ensures data integrity at the domain level.
 *
 * VARIANTS:
 *   Textual — free-form string ("HYP/2024/00123", "PKG-2024-XYZ")
 *   IMEI    — 15-digit mobile device identifier with Luhn checksum
 *   VIN     — 17-character Vehicle Identification Number
 */

import { checkArgument } from "../shared/preconditions";

export type SerialNumber =
  | TextualSerialNumber
  | ImeiSerialNumber
  | VinSerialNumber;

// ─── Textual ──────────────────────────────────────────────────────────────────

export interface TextualSerialNumber {
  readonly serialType: "TEXTUAL";
  readonly value: string;
}

export const TextualSerialNumber = {
  of(value: string): TextualSerialNumber {
    checkArgument(
      value != null && value.trim().length > 0,
      "SerialNumber cannot be blank",
    );
    return { serialType: "TEXTUAL", value };
  },
};

// ─── IMEI ─────────────────────────────────────────────────────────────────────

export interface ImeiSerialNumber {
  readonly serialType: "IMEI";
  readonly value: string;
}

export const ImeiSerialNumber = {
  of(value: string): ImeiSerialNumber {
    checkArgument(value != null, "IMEI cannot be null");
    const normalized = value.replace(/[\s-]/g, "");
    checkArgument(
      /^\d{15}$/.test(normalized),
      "IMEI must be exactly 15 digits",
    );
    checkArgument(isValidLuhn(normalized), "Invalid IMEI check digit (Luhn)");
    return { serialType: "IMEI", value: normalized };
  },
};

function isValidLuhn(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ─── VIN ──────────────────────────────────────────────────────────────────────

export interface VinSerialNumber {
  readonly serialType: "VIN";
  readonly value: string;
}

export const VinSerialNumber = {
  of(value: string): VinSerialNumber {
    checkArgument(value != null, "VIN cannot be null");
    const normalized = value.toUpperCase().replace(/[\s-]/g, "");
    checkArgument(normalized.length === 17, "VIN must be exactly 17 characters");
    checkArgument(
      /^[A-HJ-NPR-Z0-9]{17}$/.test(normalized),
      "VIN must contain only uppercase letters (excluding I, O, Q) and digits",
    );
    return { serialType: "VIN", value: normalized };
  },
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export const SerialNumber = {
  of(value: string): SerialNumber {
    return TextualSerialNumber.of(value);
  },
  vin(value: string): SerialNumber {
    return VinSerialNumber.of(value);
  },
  imei(value: string): SerialNumber {
    return ImeiSerialNumber.of(value);
  },
};
