import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

@Injectable()
export class SectorFilterStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    const sector = context.request.customer.sector;
    return {
      ...context,
      remainingTiers: context.remainingTiers.filter((tier) =>
        tier.matchesSector(sector),
      ),
    };
  }
}
