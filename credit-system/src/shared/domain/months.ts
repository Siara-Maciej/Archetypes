export class Months {
  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Months must be a non-negative integer, got: ${value}`);
    }
  }

  static of(value: number): Months {
    return new Months(value);
  }

  isWithin(min: Months, max: Months): boolean {
    return this.value >= min.value && this.value <= max.value;
  }

  equals(other: Months): boolean {
    return this.value === other.value;
  }
}
