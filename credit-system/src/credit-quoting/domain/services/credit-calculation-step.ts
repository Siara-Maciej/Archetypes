import { Money } from '../../../shared/domain/money';
import { Tier } from '../../../product-catalog/domain/model/tier';
import { CreditRequest } from './credit-request';

export interface CalculationContext {
  tier: Tier;
  request: CreditRequest;
  loanAmount: Money;
  monthlyPayment: Money | null;
  totalRepayment: Money | null;
  totalInterest: Money | null;
  extras: Record<string, Money>;
}

export interface CreditCalculationStep {
  execute(context: CalculationContext): CalculationContext;
}
