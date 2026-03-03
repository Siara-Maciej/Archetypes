export class Rate {
  constructor(readonly value: number) {
    if (value < 0 || value > 1) {
      throw new Error(`Rate must be between 0 and 1, got: ${value}`);
    }
  }

  static of(value: number): Rate {
    return new Rate(value);
  }

  static fromPercentage(percent: number): Rate {
    return new Rate(percent / 100);
  }

  get percentage(): number {
    return this.value * 100;
  }

  apply(amount: number): number {
    return Math.round(amount * this.value * 100) / 100;
  }

  equals(other: Rate): boolean {
    return this.value === other.value;
  }
}
