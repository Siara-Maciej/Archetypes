import { Tier } from '../../../product-catalog/domain/model/tier';
import { CreditRequest } from './credit-request';

export interface MatchingContext {
  request: CreditRequest;
  remainingTiers: Tier[];
  matchedTier: Tier | null;
  metadata: Record<string, unknown>;
}

export interface TierMatchingStep {
  execute(context: MatchingContext): MatchingContext;
}
