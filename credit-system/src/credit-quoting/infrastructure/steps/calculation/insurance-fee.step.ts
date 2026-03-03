import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/money';
import {
  CalculationContext,
  CreditCalculationStep,
} from '../../../domain/services/credit-calculation-step';

/**
 * Adds insurance fee if the tier requires insurance.
 * Calculated as a percentage of the loan amount.
 */
@Injectable()
export class InsuranceFeeStep implements CreditCalculationStep {
  private static readonly INSURANCE_RATE = 0.02; // 2% of loan

  execute(context: CalculationContext): CalculationContext {
    if (!context.tier.insuranceRequired) return context;

    const insuranceFee = Money.of(
      Math.round(
        context.loanAmount.amount * InsuranceFeeStep.INSURANCE_RATE * 100,
      ) / 100,
      context.loanAmount.currency,
    );

    return {
      ...context,
      extras: {
        ...context.extras,
        insurance: insuranceFee,
      },
    };
  }
}
