import { Money } from '../../../shared/domain/money';
import { Rate } from '../../../shared/domain/rate';
import { Tier } from '../../../product-catalog/domain/model/tier';
import { CreditRequest } from './credit-request';

export interface CreditCalculationResult {
  loanAmount: Money;
  monthlyPayment: Money;
  totalRepayment: Money;
  totalInterest: Money;
  effectiveInterestRate: Rate;
  extras: Record<string, Money>;
}

export interface CreditCalculationPipeline {
  execute(tier: Tier, request: CreditRequest): CreditCalculationResult;
}
