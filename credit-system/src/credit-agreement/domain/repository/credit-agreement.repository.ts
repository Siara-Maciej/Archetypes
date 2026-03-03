import { BankCode } from '../../../shared/domain';
import { CreditAgreementId } from '../model/credit-agreement-id';
import { CreditAgreement } from '../model/credit-agreement';

export const CREDIT_AGREEMENT_REPOSITORY = Symbol('CreditAgreementRepository');

export interface CreditAgreementRepository {
  save(agreement: CreditAgreement): void;
  findById(id: CreditAgreementId): CreditAgreement | undefined;
  findByAgreementNumber(number: string): CreditAgreement | undefined;
  findByBank(bankCode: BankCode): CreditAgreement[];
  findAll(): CreditAgreement[];
  remove(id: CreditAgreementId): void;
}
