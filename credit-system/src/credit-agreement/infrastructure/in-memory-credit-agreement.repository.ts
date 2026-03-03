import { Injectable } from '@nestjs/common';
import { BankCode } from '../../shared/domain';
import { CreditAgreementId } from '../domain/model/credit-agreement-id';
import { CreditAgreement } from '../domain/model/credit-agreement';
import { CreditAgreementRepository } from '../domain/repository/credit-agreement.repository';

@Injectable()
export class InMemoryCreditAgreementRepository
  implements CreditAgreementRepository
{
  private readonly storage = new Map<string, CreditAgreement>();

  save(agreement: CreditAgreement): void {
    this.storage.set(agreement.id.value, agreement);
  }

  findById(id: CreditAgreementId): CreditAgreement | undefined {
    return this.storage.get(id.value);
  }

  findByAgreementNumber(number: string): CreditAgreement | undefined {
    for (const a of this.storage.values()) {
      if (a.agreementNumber === number) return a;
    }
    return undefined;
  }

  findByBank(bankCode: BankCode): CreditAgreement[] {
    return [...this.storage.values()].filter((a) => a.bankCode === bankCode);
  }

  findAll(): CreditAgreement[] {
    return [...this.storage.values()];
  }

  remove(id: CreditAgreementId): void {
    this.storage.delete(id.value);
  }
}
