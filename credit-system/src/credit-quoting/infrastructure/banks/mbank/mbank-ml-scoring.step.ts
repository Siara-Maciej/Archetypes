import { Injectable } from '@nestjs/common';
import { Tier } from '../../../../product-catalog/domain/model/tier';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * mBank-specific: ML-based tier scoring.
 * Uses a simplified ML model to score each remaining tier
 * and keeps only the top 3 candidates for further selection.
 */
@Injectable()
export class MBankMLScoringStep implements TierMatchingStep {
  execute(context: MatchingContext): MatchingContext {
    if (context.remainingTiers.length <= 3) return context;

    const scored = context.remainingTiers.map((tier) => ({
      tier,
      score: this.scoreTier(tier, context),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topTiers = scored.slice(0, 3).map((s) => s.tier);

    return {
      ...context,
      remainingTiers: topTiers,
      metadata: {
        ...context.metadata,
        mbankMLScores: scored.map((s) => ({
          tierId: s.tier.id.value,
          score: s.score,
        })),
      },
    };
  }

  private scoreTier(tier: Tier, context: MatchingContext): number {
    let score = 0;
    const salary = context.request.customer.netMonthlySalary;

    // Favor tiers where salary is in the middle of the range
    const rangeMid = tier.salaryRange.max
      ? (tier.salaryRange.min + tier.salaryRange.max) / 2
      : tier.salaryRange.min * 1.5;
    const distanceFromMid = Math.abs(salary - rangeMid) / rangeMid;
    score += Math.max(0, 100 - distanceFromMid * 100);

    // Lower interest rates score higher
    score += (1 - tier.interestRate.value) * 50;

    // Longer max terms are more flexible
    score += tier.maxTerm.value / 12;

    return Math.round(score * 100) / 100;
  }
}
