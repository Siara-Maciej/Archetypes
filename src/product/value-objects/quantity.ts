/**
 * Quantity & Unit — measuring amounts of products.
 *
 * WHY: Products are measured in different units — pieces, kilograms, meters,
 *      square meters, liters. A raw number without a unit is meaningless
 *      ("5 of what?") and dangerous (unit mismatch bugs). Wrapping amount + unit
 *      together prevents these errors at the type level.
 *
 * WHAT:
 *   - Unit:     a measurement unit (pieces, kg, m, m², L)
 *   - Quantity: an immutable (amount, unit) pair
 *
 * This is a VALUE OBJECT — immutable, compared by amount + unit.
 */

import { checkArgument } from "../shared/preconditions";

export class Unit {
  readonly symbol: string;
  readonly name: string;

  private constructor(symbol: string, name: string) {
    this.symbol = symbol;
    this.name = name;
  }

  static pieces(): Unit {
    return new Unit("pcs", "pieces");
  }
  static kilograms(): Unit {
    return new Unit("kg", "kilograms");
  }
  static meters(): Unit {
    return new Unit("m", "meters");
  }
  static squareMeters(): Unit {
    return new Unit("m²", "square meters");
  }
  static liters(): Unit {
    return new Unit("L", "liters");
  }

  /** Parses a Unit from its symbol string. */
  static fromSymbol(symbol: string): Unit {
    switch (symbol) {
      case "pcs":
        return Unit.pieces();
      case "kg":
        return Unit.kilograms();
      case "m":
        return Unit.meters();
      case "m²":
        return Unit.squareMeters();
      case "L":
        return Unit.liters();
      default:
        return new Unit(symbol, symbol);
    }
  }

  equals(other: Unit): boolean {
    return this.symbol === other.symbol;
  }

  toString(): string {
    return this.symbol;
  }
}

export class Quantity {
  readonly amount: number;
  readonly unit: Unit;

  private constructor(amount: number, unit: Unit) {
    this.amount = amount;
    this.unit = unit;
  }

  static of(amount: number, unit: Unit): Quantity {
    checkArgument(amount > 0, "Quantity amount must be positive");
    return new Quantity(amount, unit);
  }

  equals(other: Quantity): boolean {
    return this.amount === other.amount && this.unit.equals(other.unit);
  }

  toString(): string {
    return `${this.amount} ${this.unit.symbol}`;
  }
}
