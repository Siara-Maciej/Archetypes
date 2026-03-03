import { Tier } from '../../src/product-catalog/domain/model/tier';
import { TierId } from '../../src/product-catalog/domain/value-objects/tier-id';
import { SalaryRange } from '../../src/product-catalog/domain/value-objects/salary-range';
import { Rate } from '../../src/shared/domain/rate';
import { Months } from '../../src/shared/domain/months';
import { Money } from '../../src/shared/domain/money';
import { bankCode } from '../../src/shared/domain/bank-code';
import type { CreditRequest } from '../../src/credit-quoting/domain/services/credit-request';
import { SalaryRangeFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/salary-range-filter.step';
import { SectorFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/sector-filter.step';
import { TermFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/term-filter.step';
import { DownPaymentFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/down-payment-filter.step';
import { CreditHistoryFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/credit-history-filter.step';
import { BestRateSelectionStep } from '../../src/credit-quoting/infrastructure/steps/matching/best-rate-selection.step';
import { AnnuityCalculationStep } from '../../src/credit-quoting/infrastructure/steps/calculation/annuity-calculation.step';
import { DecliningBalanceStep } from '../../src/credit-quoting/infrastructure/steps/calculation/declining-balance.step';
import { InsuranceFeeStep } from '../../src/credit-quoting/infrastructure/steps/calculation/insurance-fee.step';
import { ProcessingFeeStep } from '../../src/credit-quoting/infrastructure/steps/calculation/processing-fee.step';
import { SantanderCreditScoringStep } from '../../src/credit-quoting/infrastructure/banks/santander/santander-credit-scoring.step';
import { MBankMLScoringStep } from '../../src/credit-quoting/infrastructure/banks/mbank/mbank-ml-scoring.step';
import { MBankPromotionalDiscountStep } from '../../src/credit-quoting/infrastructure/banks/mbank/mbank-promotional-discount.step';
import { DefaultTierMatchingPipeline } from '../../src/credit-quoting/infrastructure/pipeline/default-tier-matching.pipeline';
import { DefaultCreditCalculationPipeline } from '../../src/credit-quoting/infrastructure/pipeline/default-credit-calculation.pipeline';
import { MapBankStrategyRegistry } from '../../src/credit-quoting/infrastructure/registry/map-bank-strategy.registry';

function createTier(name: string, salary: [number, number | null], rate: number, sector: 'PRIVATE' | 'GOVERNMENT' = 'PRIVATE'): Tier {
  return new Tier({
    id: TierId.generate(),
    bankCode: bankCode('SANTANDER'),
    name,
    sector,
    salaryRange: SalaryRange.of(salary[0], salary[1]),
    interestRate: Rate.of(rate),
    maxDeductionRate: Rate.of(0.5),
    maxLoanToValue: Rate.of(0.8),
    minTerm: Months.of(12),
    maxTerm: Months.of(60),
    minDownPaymentRate: Rate.of(0.1),
    processingFee: Rate.of(0.02),
    insuranceRequired: true,
    metadata: {},
  });
}

function createRequest(overrides: Partial<CreditRequest> = {}): CreditRequest {
  return {
    customer: {
      sector: 'PRIVATE',
      employmentType: 'PERMANENT',
      netMonthlySalary: 7000,
      monthlyObligations: 1000,
      employmentMonths: 36,
    },
    vehicle: {
      price: Money.of(80000),
      isNew: true,
      year: 2024,
    },
    requestedTermMonths: 36,
    downPayment: Money.of(16000),
    bankOfferId: 'offer-1',
    ...overrides,
  };
}

describe('Tier Matching Pipeline', () => {
  it('filters by salary range and selects best rate', () => {
    const pipeline = new DefaultTierMatchingPipeline([
      new SalaryRangeFilterStep(),
      new BestRateSelectionStep(),
    ]);

    const tiers = [
      createTier('Low', [3000, 5000], 0.1),
      createTier('Mid', [5000, 10000], 0.08),
      createTier('High', [10000, null], 0.06),
    ];

    const result = pipeline.execute(createRequest(), tiers);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.tier.name).toBe('Mid');
    }
  });

  it('filters by sector', () => {
    const pipeline = new DefaultTierMatchingPipeline([
      new SectorFilterStep(),
      new BestRateSelectionStep(),
    ]);

    const tiers = [
      createTier('Private-1', [3000, 15000], 0.08, 'PRIVATE'),
      createTier('Gov-1', [3000, 15000], 0.06, 'GOVERNMENT'),
    ];

    const result = pipeline.execute(createRequest(), tiers);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.tier.name).toBe('Private-1');
    }
  });

  it('filters by term', () => {
    const pipeline = new DefaultTierMatchingPipeline([
      new TermFilterStep(),
      new BestRateSelectionStep(),
    ]);

    const shortTier = new Tier({
      id: TierId.generate(),
      bankCode: bankCode('SANTANDER'),
      name: 'Short',
      sector: 'PRIVATE',
      salaryRange: SalaryRange.of(0, null),
      interestRate: Rate.of(0.06),
      maxDeductionRate: Rate.of(0.5),
      maxLoanToValue: Rate.of(0.8),
      minTerm: Months.of(6),
      maxTerm: Months.of(24),
      minDownPaymentRate: Rate.of(0.1),
      processingFee: Rate.of(0.02),
      insuranceRequired: false,
      metadata: {},
    });

    const longTier = createTier('Long', [0, null], 0.08);

    // Request is for 36 months — only longTier allows it
    const result = pipeline.execute(createRequest(), [shortTier, longTier]);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.tier.name).toBe('Long');
    }
  });

  it('returns no_match when all tiers filtered out', () => {
    const pipeline = new DefaultTierMatchingPipeline([
      new SalaryRangeFilterStep(),
      new BestRateSelectionStep(),
    ]);

    const tiers = [createTier('VeryHigh', [20000, null], 0.05)];

    const result = pipeline.execute(createRequest(), tiers);
    expect(result.kind).toBe('no_match');
  });

  it('Santander scoring filters premium tiers for low-score customers', () => {
    const pipeline = new DefaultTierMatchingPipeline([
      new SalaryRangeFilterStep(),
      new SantanderCreditScoringStep(),
      new BestRateSelectionStep(),
    ]);

    // Customer with short employment and high obligations → low score
    const request = createRequest({
      customer: {
        sector: 'PRIVATE',
        employmentType: 'CONTRACT',
        netMonthlySalary: 7000,
        monthlyObligations: 5000, // high DTI
        employmentMonths: 6, // short employment
      },
    });

    const premiumTier = new Tier({
      ...createTier('Premium', [5000, 10000], 0.05),
      metadata: { premium: 'true' },
    } as any);

    // Rebuild properly with metadata
    const premium = new Tier({
      id: TierId.generate(),
      bankCode: bankCode('SANTANDER'),
      name: 'Premium',
      sector: 'PRIVATE',
      salaryRange: SalaryRange.of(5000, 10000),
      interestRate: Rate.of(0.05),
      maxDeductionRate: Rate.of(0.5),
      maxLoanToValue: Rate.of(0.8),
      minTerm: Months.of(12),
      maxTerm: Months.of(60),
      minDownPaymentRate: Rate.of(0.1),
      processingFee: Rate.of(0.02),
      insuranceRequired: true,
      metadata: { premium: 'true' },
    });

    const standard = createTier('Standard', [5000, 10000], 0.085);

    const result = pipeline.execute(request, [premium, standard]);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      // Premium should be filtered out due to low credit score
      expect(result.tier.name).toBe('Standard');
    }
  });
});

describe('Credit Calculation Pipeline', () => {
  it('calculates annuity payments', () => {
    const pipeline = new DefaultCreditCalculationPipeline([
      new AnnuityCalculationStep(),
    ]);

    const tier = createTier('Standard', [5000, 10000], 0.06);
    const request = createRequest();

    const result = pipeline.execute(tier, request);
    expect(result.loanAmount.amount).toBe(64000); // 80000 - 16000
    expect(result.monthlyPayment.amount).toBeGreaterThan(0);
    expect(result.totalRepayment.amount).toBeGreaterThan(64000);
    expect(result.totalInterest.amount).toBeGreaterThan(0);
  });

  it('calculates declining balance payments', () => {
    const pipeline = new DefaultCreditCalculationPipeline([
      new DecliningBalanceStep(),
    ]);

    const tier = createTier('Standard', [5000, 10000], 0.06);
    const result = pipeline.execute(tier, createRequest());
    expect(result.loanAmount.amount).toBe(64000);
    expect(result.monthlyPayment.amount).toBeGreaterThan(0);
    // Declining balance first payment > annuity first payment for same params
    expect(result.totalInterest.amount).toBeGreaterThan(0);
  });

  it('adds insurance fee when required', () => {
    const pipeline = new DefaultCreditCalculationPipeline([
      new AnnuityCalculationStep(),
      new InsuranceFeeStep(),
    ]);

    const tier = createTier('Standard', [5000, 10000], 0.06);
    const result = pipeline.execute(tier, createRequest());
    expect(result.extras['insurance']).toBeDefined();
    expect(result.extras['insurance'].amount).toBe(1280); // 2% of 64000
  });

  it('skips insurance fee when not required', () => {
    const pipeline = new DefaultCreditCalculationPipeline([
      new AnnuityCalculationStep(),
      new InsuranceFeeStep(),
    ]);

    const tier = new Tier({
      id: TierId.generate(),
      bankCode: bankCode('SANTANDER'),
      name: 'NoInsurance',
      sector: 'PRIVATE',
      salaryRange: SalaryRange.of(5000, 10000),
      interestRate: Rate.of(0.06),
      maxDeductionRate: Rate.of(0.5),
      maxLoanToValue: Rate.of(0.8),
      minTerm: Months.of(12),
      maxTerm: Months.of(60),
      minDownPaymentRate: Rate.of(0.1),
      processingFee: Rate.of(0.02),
      insuranceRequired: false,
      metadata: {},
    });

    const result = pipeline.execute(tier, createRequest());
    expect(result.extras['insurance']).toBeUndefined();
  });

  it('adds processing fee', () => {
    const pipeline = new DefaultCreditCalculationPipeline([
      new AnnuityCalculationStep(),
      new ProcessingFeeStep(),
    ]);

    const tier = createTier('Standard', [5000, 10000], 0.06);
    const result = pipeline.execute(tier, createRequest());
    expect(result.extras['processingFee']).toBeDefined();
    expect(result.extras['processingFee'].amount).toBe(1280); // 2% of 64000
  });

  it('mBank promotional discount reduces total', () => {
    const pipelineWithPromo = new DefaultCreditCalculationPipeline([
      new AnnuityCalculationStep(),
      new MBankPromotionalDiscountStep(),
    ]);

    const pipelineNoPromo = new DefaultCreditCalculationPipeline([
      new AnnuityCalculationStep(),
    ]);

    const tier = createTier('Standard', [5000, 10000], 0.06);
    const request = createRequest();

    const withPromo = pipelineWithPromo.execute(tier, request);
    const noPromo = pipelineNoPromo.execute(tier, request);

    expect(withPromo.totalRepayment.amount).toBeLessThan(
      noPromo.totalRepayment.amount,
    );
    expect(withPromo.extras['promotionalDiscount']).toBeDefined();
    expect(withPromo.extras['promotionalDiscount'].amount).toBeGreaterThan(0);
  });
});

describe('BankStrategyRegistry', () => {
  it('resolves pipelines for supported bank', () => {
    const registry = new MapBankStrategyRegistry(
      new Map([
        [
          'SANTANDER',
          {
            tierMatcher: new DefaultTierMatchingPipeline([
              new SalaryRangeFilterStep(),
              new BestRateSelectionStep(),
            ]),
            calculator: new DefaultCreditCalculationPipeline([
              new AnnuityCalculationStep(),
            ]),
          },
        ],
      ]),
    );

    expect(registry.isSupported(bankCode('SANTANDER'))).toBe(true);
    const pipelines = registry.resolve(bankCode('SANTANDER'));
    expect(pipelines.tierMatcher).toBeDefined();
    expect(pipelines.calculator).toBeDefined();
  });

  it('throws for unsupported bank', () => {
    const registry = new MapBankStrategyRegistry(new Map());
    expect(() => registry.resolve(bankCode('UNKNOWN'))).toThrow(
      'No strategy configured',
    );
  });

  it('each bank gets independent pipeline configuration', () => {
    const santanderPipeline = new DefaultTierMatchingPipeline([
      new SalaryRangeFilterStep(),
      new SantanderCreditScoringStep(),
      new BestRateSelectionStep(),
    ]);

    const mbankPipeline = new DefaultTierMatchingPipeline([
      new SalaryRangeFilterStep(),
      new MBankMLScoringStep(),
      new BestRateSelectionStep(),
    ]);

    const registry = new MapBankStrategyRegistry(
      new Map([
        [
          'SANTANDER',
          {
            tierMatcher: santanderPipeline,
            calculator: new DefaultCreditCalculationPipeline([
              new AnnuityCalculationStep(),
            ]),
          },
        ],
        [
          'MBANK',
          {
            tierMatcher: mbankPipeline,
            calculator: new DefaultCreditCalculationPipeline([
              new AnnuityCalculationStep(),
              new MBankPromotionalDiscountStep(),
            ]),
          },
        ],
      ]),
    );

    // Both banks resolve independently
    const santander = registry.resolve(bankCode('SANTANDER'));
    const mbank = registry.resolve(bankCode('MBANK'));
    expect(santander.tierMatcher).not.toBe(mbank.tierMatcher);
  });
});
