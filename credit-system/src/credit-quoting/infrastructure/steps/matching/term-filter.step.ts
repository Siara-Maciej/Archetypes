import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * Filters tiers based on whether the requested term is within allowed range.
 */
@Injectable()
export class TermFilterStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    const requestedTerm = context.request.requestedTermMonths;
    return {
      ...context,
      remainingTiers: context.remainingTiers.filter((tier) =>
        tier.isTermAllowed(requestedTerm),
      ),
    };
  }
}
