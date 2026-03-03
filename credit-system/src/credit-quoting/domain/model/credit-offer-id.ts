import { randomUUID } from 'crypto';

export class CreditOfferId {
  constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CreditOfferId cannot be empty');
    }
  }

  static generate(): CreditOfferId {
    return new CreditOfferId(randomUUID());
  }

  static of(value: string): CreditOfferId {
    return new CreditOfferId(value);
  }

  equals(other: CreditOfferId): boolean {
    return this.value === other.value;
  }
}
