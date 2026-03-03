import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * Filters tiers based on whether the down payment meets minimum requirements.
 */
@Injectable()
export class DownPaymentFilterStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    const downPayment = context.request.downPayment.amount;
    const vehiclePrice = context.request.vehicle.price.amount;
    const downPaymentRate = vehiclePrice > 0 ? downPayment / vehiclePrice : 0;

    return {
      ...context,
      remainingTiers: context.remainingTiers.filter(
        (tier) => downPaymentRate >= tier.minDownPaymentRate.value,
      ),
      metadata: {
        ...context.metadata,
        downPaymentRate,
      },
    };
  }
}
