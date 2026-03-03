import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * Santander-specific: Internal credit scoring step.
 * Evaluates customer creditworthiness based on employment duration
 * and debt-to-income ratio. Filters out tiers that require
 * higher credit scores than the customer qualifies for.
 */
@Injectable()
export class SantanderCreditScoringStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    const { employmentMonths, netMonthlySalary, monthlyObligations } =
      context.request.customer;

    // Santander internal scoring algorithm (simplified)
    let score = 500; // base score
    if (employmentMonths >= 12) score += 100;
    if (employmentMonths >= 36) score += 100;
    if (employmentMonths >= 60) score += 50;

    const dtiRatio =
      netMonthlySalary > 0 ? monthlyObligations / netMonthlySalary : 1;
    if (dtiRatio < 0.2) score += 100;
    else if (dtiRatio < 0.4) score += 50;
    else if (dtiRatio > 0.6) score -= 100;

    // Score threshold: 600+ allows all tiers, 500-600 removes premium tiers
    const filtered =
      score >= 600
        ? context.remainingTiers
        : context.remainingTiers.filter(
            (t) => !t.metadata['premium'] || t.metadata['premium'] !== 'true',
          );

    return {
      ...context,
      remainingTiers: filtered,
      metadata: {
        ...context.metadata,
        santanderCreditScore: score,
      },
    };
  }
}
