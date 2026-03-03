import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/money';
import {
  CalculationContext,
  CreditCalculationStep,
} from '../../../domain/services/credit-calculation-step';

/**
 * Calculates equal monthly payments (annuity / raty równe).
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
@Injectable()
export class AnnuityCalculationStep implements CreditCalculationStep {
  execute(context: CalculationContext): CalculationContext {
    const principal = context.loanAmount.amount;
    const monthlyRate = context.tier.interestRate.value / 12;
    const n = context.request.requestedTermMonths;
    const currency = context.loanAmount.currency;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = principal / n;
    } else {
      const factor = Math.pow(1 + monthlyRate, n);
      monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    }

    monthlyPayment = Math.round(monthlyPayment * 100) / 100;
    const totalRepayment = Math.round(monthlyPayment * n * 100) / 100;
    const totalInterest = Math.round((totalRepayment - principal) * 100) / 100;

    return {
      ...context,
      monthlyPayment: Money.of(monthlyPayment, currency),
      totalRepayment: Money.of(totalRepayment, currency),
      totalInterest: Money.of(totalInterest, currency),
    };
  }
}
