import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * Selects the tier with the best (lowest) interest rate from remaining candidates.
 * This is typically the LAST step in a matching pipeline.
 */
@Injectable()
export class BestRateSelectionStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    if (context.remainingTiers.length === 0) return context;

    const bestTier = context.remainingTiers.reduce((best, current) =>
      current.interestRate.value < best.interestRate.value ? current : best,
    );

    return {
      ...context,
      matchedTier: bestTier,
    };
  }
}
