import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/money';
import {
  CalculationContext,
  CreditCalculationStep,
} from '../../../domain/services/credit-calculation-step';

/**
 * Calculates declining balance payments (raty malejące).
 * Principal portion is constant, interest decreases over time.
 * Monthly payment returned is the FIRST (highest) payment.
 */
@Injectable()
export class DecliningBalanceStep implements CreditCalculationStep {
  execute(context: CalculationContext): CalculationContext {
    const principal = context.loanAmount.amount;
    const monthlyRate = context.tier.interestRate.value / 12;
    const n = context.request.requestedTermMonths;
    const currency = context.loanAmount.currency;

    const principalPortion = principal / n;
    let totalRepayment = 0;
    let totalInterest = 0;

    for (let i = 0; i < n; i++) {
      const remainingPrincipal = principal - principalPortion * i;
      const interestPortion = remainingPrincipal * monthlyRate;
      totalInterest += interestPortion;
      totalRepayment += principalPortion + interestPortion;
    }

    // First (highest) monthly payment
    const firstPayment = principalPortion + principal * monthlyRate;

    return {
      ...context,
      monthlyPayment: Money.of(
        Math.round(firstPayment * 100) / 100,
        currency,
      ),
      totalRepayment: Money.of(
        Math.round(totalRepayment * 100) / 100,
        currency,
      ),
      totalInterest: Money.of(
        Math.round(totalInterest * 100) / 100,
        currency,
      ),
    };
  }
}
