import type { CreditOfferStatus } from '../../domain/model/credit-offer';

export interface CreditOfferView {
  id: string;
  bankCode: string;
  tierId: string;
  bankOfferId: string;
  creditAmount: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  effectiveInterestRate: number;
  termMonths: number;
  extras: Record<string, number>;
  status: CreditOfferStatus;
  createdAt: string;
  expiresAt: string;
  currency: string;
}
