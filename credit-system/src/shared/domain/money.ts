export class Money {
  constructor(
    readonly amount: number,
    readonly currency: string = 'PLN',
  ) {
    if (amount < 0) throw new Error('Money amount cannot be negative');
  }

  static of(amount: number, currency = 'PLN'): Money {
    return new Money(amount, currency);
  }

  static zero(currency = 'PLN'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(
      Math.round(this.amount * factor * 100) / 100,
      this.currency,
    );
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
