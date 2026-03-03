import { Tier } from '../../src/product-catalog/domain/model/tier';
import { TierId } from '../../src/product-catalog/domain/value-objects/tier-id';
import { SalaryRange } from '../../src/product-catalog/domain/value-objects/salary-range';
import { Rate } from '../../src/shared/domain/rate';
import { Months } from '../../src/shared/domain/months';
import { bankCode } from '../../src/shared/domain/bank-code';

function createTier(overrides: Partial<ConstructorParameters<typeof Tier>[0]> = {}): Tier {
  return new Tier({
    id: TierId.generate(),
    bankCode: bankCode('SANTANDER'),
    name: 'Standard Tier',
    sector: 'PRIVATE',
    salaryRange: SalaryRange.of(5000, 10000),
    interestRate: Rate.of(0.085),
    maxDeductionRate: Rate.of(0.5),
    maxLoanToValue: Rate.of(0.8),
    minTerm: Months.of(12),
    maxTerm: Months.of(60),
    minDownPaymentRate: Rate.of(0.1),
    processingFee: Rate.of(0.02),
    insuranceRequired: true,
    metadata: {},
    ...overrides,
  });
}

describe('Tier', () => {
  it('creates a valid tier', () => {
    const tier = createTier();
    expect(tier.name).toBe('Standard Tier');
    expect(tier.sector).toBe('PRIVATE');
    expect(tier.interestRate.value).toBe(0.085);
  });

  it('rejects empty name', () => {
    expect(() => createTier({ name: '' })).toThrow('name cannot be empty');
  });

  it('rejects maxTerm < minTerm', () => {
    expect(() =>
      createTier({ minTerm: Months.of(60), maxTerm: Months.of(12) }),
    ).toThrow('maxTerm cannot be less than minTerm');
  });

  it('matches salary within range', () => {
    const tier = createTier();
    expect(tier.matchesSalary(7000)).toBe(true);
    expect(tier.matchesSalary(3000)).toBe(false);
    expect(tier.matchesSalary(15000)).toBe(false);
  });

  it('matches sector', () => {
    const tier = createTier({ sector: 'GOVERNMENT' });
    expect(tier.matchesSector('GOVERNMENT')).toBe(true);
    expect(tier.matchesSector('PRIVATE')).toBe(false);
  });

  it('checks term allowance', () => {
    const tier = createTier();
    expect(tier.isTermAllowed(24)).toBe(true);
    expect(tier.isTermAllowed(6)).toBe(false);
    expect(tier.isTermAllowed(72)).toBe(false);
  });
});
