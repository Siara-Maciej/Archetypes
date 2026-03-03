import { randomUUID } from 'crypto';

export class BankOfferId {
  constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('BankOfferId cannot be empty');
    }
  }

  static generate(): BankOfferId {
    return new BankOfferId(randomUUID());
  }

  static of(value: string): BankOfferId {
    return new BankOfferId(value);
  }

  equals(other: BankOfferId): boolean {
    return this.value === other.value;
  }
}
