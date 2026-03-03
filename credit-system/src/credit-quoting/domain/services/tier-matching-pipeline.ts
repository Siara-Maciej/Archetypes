import { Tier } from '../../../product-catalog/domain/model/tier';
import { CreditRequest } from './credit-request';

export type TierMatchResult =
  | { kind: 'matched'; tier: Tier }
  | { kind: 'no_match'; reason: string };

export interface TierMatchingPipeline {
  execute(request: CreditRequest, tiers: Tier[]): TierMatchResult;
}
