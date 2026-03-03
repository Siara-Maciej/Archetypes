import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/money';
import {
  CalculationContext,
  CreditCalculationStep,
} from '../../../domain/services/credit-calculation-step';

/**
 * Adds processing fee based on the tier's processing fee rate.
 */
@Injectable()
export class ProcessingFeeStep implements CreditCalculationStep {
  execute(context: CalculationContext): CalculationContext {
    if (context.tier.processingFee.value === 0) return context;

    const fee = Money.of(
      Math.round(
        context.loanAmount.amount * context.tier.processingFee.value * 100,
      ) / 100,
      context.loanAmount.currency,
    );

    return {
      ...context,
      extras: {
        ...context.extras,
        processingFee: fee,
      },
    };
  }
}
