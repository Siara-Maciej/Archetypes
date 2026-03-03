import { Injectable } from '@nestjs/common';
import {
  MatchingContext,
  TierMatchingStep,
} from '../../../domain/services/tier-matching-step';

/**
 * PKO-specific: Manual override lookup.
 * Checks if a specific tier has been pre-assigned via manual override
 * (e.g., by a relationship manager). If found, sets that tier directly.
 */
@Injectable()
export class PkoManualOverrideStep implements TierMatchingStep {
  // In production, this would be injected as a repository
  private readonly overrides = new Map<string, string>();

  addOverride(sector: string, salary: number, tierId: string): void {
    this.overrides.set(`${sector}:${Math.floor(salary / 1000)}k`, tierId);
  }

  execute(context: MatchingContext): MatchingContext {
    const key = `${context.request.customer.sector}:${Math.floor(context.request.customer.netMonthlySalary / 1000)}k`;
    const overrideTierId = this.overrides.get(key);

    if (overrideTierId) {
      const overrideTier = context.remainingTiers.find(
        (t) => t.id.value === overrideTierId,
      );
      if (overrideTier) {
        return {
          ...context,
          matchedTier: overrideTier,
          metadata: {
            ...context.metadata,
            pkoManualOverride: true,
            overrideTierId,
          },
        };
      }
    }

    return context;
  }
}
