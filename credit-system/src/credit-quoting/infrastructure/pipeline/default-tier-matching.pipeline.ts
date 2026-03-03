import { Tier } from '../../../product-catalog/domain/model/tier';
import { CreditRequest } from '../../domain/services/credit-request';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../domain/services/tier-matching-step';
import {
  TierMatchResult,
  TierMatchingPipeline,
} from '../../domain/services/tier-matching-pipeline';

export class DefaultTierMatchingPipeline implements TierMatchingPipeline {
  constructor(private readonly steps: TierMatchingStep[]) {}

  execute(request: CreditRequest, tiers: Tier[]): TierMatchResult {
    let context: MatchingContext = {
      request,
      remainingTiers: [...tiers],
      matchedTier: null,
      metadata: {},
    };

    for (const step of this.steps) {
      context = step.execute(context);
      // Early exit if a step already selected a tier
      if (context.matchedTier) break;
      // Early exit if no tiers remain
      if (context.remainingTiers.length === 0) break;
    }

    if (context.matchedTier) {
      return { kind: 'matched', tier: context.matchedTier };
    }
    return {
      kind: 'no_match',
      reason: `No tier matched after ${this.steps.length} pipeline steps. Remaining tiers: ${context.remainingTiers.length}`,
    };
  }
}
