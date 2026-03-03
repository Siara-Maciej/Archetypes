import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

@Injectable()
export class SalaryRangeFilterStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    const salary = context.request.customer.netMonthlySalary;
    return {
      ...context,
      remainingTiers: context.remainingTiers.filter((tier) =>
        tier.matchesSalary(salary),
      ),
    };
  }
}
