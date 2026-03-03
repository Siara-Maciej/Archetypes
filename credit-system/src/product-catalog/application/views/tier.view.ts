import { Sector } from '../../domain/value-objects/sector';

export interface TierView {
  id: string;
  bankCode: string;
  name: string;
  sector: Sector;
  salaryMin: number;
  salaryMax: number | null;
  interestRate: number;
  maxDeductionRate: number;
  maxLoanToValue: number;
  minTermMonths: number;
  maxTermMonths: number;
  minDownPaymentRate: number;
  processingFee: number;
  insuranceRequired: boolean;
  metadata: Record<string, string>;
}

export interface BankOfferView {
  id: string;
  bankCode: string;
  displayName: string;
  description: string;
  sectors: { sector: Sector; tierIds: string[] }[];
  validFrom: string;
  validUntil: string;
  categories: string[];
  metadata: Record<string, string>;
}
