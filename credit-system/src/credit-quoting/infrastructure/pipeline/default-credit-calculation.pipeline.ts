import { Money } from '../../../shared/domain/money';
import { Rate } from '../../../shared/domain/rate';
import { Tier } from '../../../product-catalog/domain/model/tier';
import { CreditRequest } from '../../domain/services/credit-request';
import {
  CalculationContext,
  CreditCalculationStep,
} from '../../domain/services/credit-calculation-step';
import {
  CreditCalculationResult,
  CreditCalculationPipeline,
} from '../../domain/services/credit-calculation-pipeline';

export class DefaultCreditCalculationPipeline
  implements CreditCalculationPipeline
{
  constructor(private readonly steps: CreditCalculationStep[]) {}

  execute(tier: Tier, request: CreditRequest): CreditCalculationResult {
    const loanAmount = request.vehicle.price.subtract(request.downPayment);

    let context: CalculationContext = {
      tier,
      request,
      loanAmount,
      monthlyPayment: null,
      totalRepayment: null,
      totalInterest: null,
      extras: {},
    };

    for (const step of this.steps) {
      context = step.execute(context);
    }

    const monthlyPayment =
      context.monthlyPayment ?? Money.zero(loanAmount.currency);
    const totalRepayment =
      context.totalRepayment ?? Money.zero(loanAmount.currency);
    const totalInterest =
      context.totalInterest ?? Money.zero(loanAmount.currency);

    // Calculate effective interest rate (RRSO) — simplified as total cost / loan
    const totalExtras = Object.values(context.extras).reduce(
      (sum, m) => sum.add(m),
      Money.zero(loanAmount.currency),
    );
    const totalCost = totalInterest.add(totalExtras);
    const effectiveRate =
      loanAmount.amount > 0
        ? Rate.of(
            Math.min(totalCost.amount / loanAmount.amount, 1),
          )
        : Rate.of(0);

    return {
      loanAmount,
      monthlyPayment,
      totalRepayment,
      totalInterest,
      effectiveInterestRate: effectiveRate,
      extras: { ...context.extras },
    };
  }
}
