import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/money';
import {
  CalculationContext,
  CreditCalculationStep,
} from '../../../domain/services/credit-calculation-step';

/**
 * mBank-specific: Promotional discount for the first 12 months.
 * Reduces monthly payment by 20% for the first year, recalculates totals.
 */
@Injectable()
export class MBankPromotionalDiscountStep implements CreditCalculationStep {
  private static readonly DISCOUNT_MONTHS = 12;
  private static readonly DISCOUNT_RATE = 0.2; // 20% off

  execute(context: CalculationContext): CalculationContext {
    if (!context.monthlyPayment) return context;

    const n = context.request.requestedTermMonths;
    const discountMonths = Math.min(
      MBankPromotionalDiscountStep.DISCOUNT_MONTHS,
      n,
    );
    const normalMonths = n - discountMonths;
    const currency = context.loanAmount.currency;

    const normalPayment = context.monthlyPayment.amount;
    const discountedPayment =
      normalPayment * (1 - MBankPromotionalDiscountStep.DISCOUNT_RATE);

    const totalSavings =
      (normalPayment - discountedPayment) * discountMonths;

    const newTotal =
      discountedPayment * discountMonths + normalPayment * normalMonths;

    return {
      ...context,
      totalRepayment: Money.of(
        Math.round(newTotal * 100) / 100,
        currency,
      ),
      totalInterest: Money.of(
        Math.round((newTotal - context.loanAmount.amount) * 100) / 100,
        currency,
      ),
      extras: {
        ...context.extras,
        promotionalDiscount: Money.of(
          Math.round(totalSavings * 100) / 100,
          currency,
        ),
      },
    };
  }
}
