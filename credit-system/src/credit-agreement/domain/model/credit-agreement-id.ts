import { randomUUID } from 'crypto';

export class CreditAgreementId {
  constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CreditAgreementId cannot be empty');
    }
  }

  static generate(): CreditAgreementId {
    return new CreditAgreementId(randomUUID());
  }

  static of(value: string): CreditAgreementId {
    return new CreditAgreementId(value);
  }

  equals(other: CreditAgreementId): boolean {
    return this.value === other.value;
  }
}
