import type { Sector } from '../../product-catalog/domain/value-objects/sector';

export class DefineTierDto {
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
  metadata?: Record<string, string>;
}
