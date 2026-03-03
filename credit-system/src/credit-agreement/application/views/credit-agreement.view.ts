import type { CreditAgreementStatus } from '../../domain/model/credit-agreement';

export interface CreditAgreementView {
  id: string;
  agreementNumber: string;
  bankCode: string;
  creditOfferId: string;
  tierId: string;
  creditAmount: number;
  monthlyPayment: number;
  interestRate: number;
  termMonths: number;
  status: CreditAgreementStatus;
  signedAt: string;
  currency: string;
}
