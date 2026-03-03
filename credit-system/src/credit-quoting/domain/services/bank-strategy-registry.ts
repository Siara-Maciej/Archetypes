import { BankCode } from '../../../shared/domain';
import { TierMatchingPipeline } from './tier-matching-pipeline';
import { CreditCalculationPipeline } from './credit-calculation-pipeline';

export const BANK_STRATEGY_REGISTRY = Symbol('BankStrategyRegistry');

export interface BankPipelines {
  tierMatcher: TierMatchingPipeline;
  calculator: CreditCalculationPipeline;
}

export interface BankStrategyRegistry {
  resolve(bankCode: BankCode): BankPipelines;
  isSupported(bankCode: BankCode): boolean;
}
