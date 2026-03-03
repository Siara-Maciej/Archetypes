import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * Filters tiers based on customer's existing obligations.
 * Removes tiers where max deduction rate would be exceeded.
 */
@Injectable()
export class CreditHistoryFilterStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    const { netMonthlySalary, monthlyObligations } = context.request.customer;
    const currentDeductionRate =
      netMonthlySalary > 0 ? monthlyObligations / netMonthlySalary : 1;

    return {
      ...context,
      remainingTiers: context.remainingTiers.filter(
        (tier) => currentDeductionRate < tier.maxDeductionRate.value,
      ),
      metadata: {
        ...context.metadata,
        currentDeductionRate,
      },
    };
  }
}
