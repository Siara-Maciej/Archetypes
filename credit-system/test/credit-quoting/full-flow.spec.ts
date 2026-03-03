import { Tier } from '../../src/product-catalog/domain/model/tier';
import { TierId } from '../../src/product-catalog/domain/value-objects/tier-id';
import { SalaryRange } from '../../src/product-catalog/domain/value-objects/salary-range';
import { BankOffer } from '../../src/product-catalog/domain/model/bank-offer';
import { BankOfferId } from '../../src/product-catalog/domain/value-objects/bank-offer-id';
import { Rate } from '../../src/shared/domain/rate';
import { Months } from '../../src/shared/domain/months';
import { Money } from '../../src/shared/domain/money';
import { bankCode } from '../../src/shared/domain/bank-code';
import { InMemoryTierRepository } from '../../src/product-catalog/infrastructure/in-memory-tier.repository';
import { InMemoryBankOfferRepository } from '../../src/product-catalog/infrastructure/in-memory-bank-offer.repository';
import { InMemoryCreditOfferRepository } from '../../src/credit-quoting/infrastructure/persistence/in-memory-credit-offer.repository';
import { MapBankStrategyRegistry } from '../../src/credit-quoting/infrastructure/registry/map-bank-strategy.registry';
import { DefaultTierMatchingPipeline } from '../../src/credit-quoting/infrastructure/pipeline/default-tier-matching.pipeline';
import { DefaultCreditCalculationPipeline } from '../../src/credit-quoting/infrastructure/pipeline/default-credit-calculation.pipeline';
import { SalaryRangeFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/salary-range-filter.step';
import { SectorFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/sector-filter.step';
import { TermFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/term-filter.step';
import { DownPaymentFilterStep } from '../../src/credit-quoting/infrastructure/steps/matching/down-payment-filter.step';
import { BestRateSelectionStep } from '../../src/credit-quoting/infrastructure/steps/matching/best-rate-selection.step';
import { AnnuityCalculationStep } from '../../src/credit-quoting/infrastructure/steps/calculation/annuity-calculation.step';
import { DecliningBalanceStep } from '../../src/credit-quoting/infrastructure/steps/calculation/declining-balance.step';
import { InsuranceFeeStep } from '../../src/credit-quoting/infrastructure/steps/calculation/insurance-fee.step';
import { ProcessingFeeStep } from '../../src/credit-quoting/infrastructure/steps/calculation/processing-fee.step';
import { SantanderCreditScoringStep } from '../../src/credit-quoting/infrastructure/banks/santander/santander-credit-scoring.step';
import { MBankPromotionalDiscountStep } from '../../src/credit-quoting/infrastructure/banks/mbank/mbank-promotional-discount.step';
import { CalculateCreditOfferHandler, CalculateCreditOfferCommand } from '../../src/credit-quoting/application/commands/calculate-credit-offer.command';
import { AcceptCreditOfferHandler, AcceptCreditOfferCommand } from '../../src/credit-quoting/application/commands/accept-credit-offer.command';
import { CreditOfferId } from '../../src/credit-quoting/domain/model/credit-offer-id';
import { InMemoryCreditAgreementRepository } from '../../src/credit-agreement/infrastructure/in-memory-credit-agreement.repository';
import { CreateAgreementHandler, CreateAgreementCommand } from '../../src/credit-agreement/application/commands/create-agreement.command';

describe('Full Credit Flow — Multi-Bank', () => {
  let tierRepo: InMemoryTierRepository;
  let bankOfferRepo: InMemoryBankOfferRepository;
  let creditOfferRepo: InMemoryCreditOfferRepository;
  let agreementRepo: InMemoryCreditAgreementRepository;
  let registry: MapBankStrategyRegistry;
  let calculateHandler: CalculateCreditOfferHandler;
  let acceptHandler: AcceptCreditOfferHandler;
  let createAgreementHandler: CreateAgreementHandler;

  // Tier IDs
  let santanderLowTierId: TierId;
  let santanderMidTierId: TierId;
  let pkoBpTierId: TierId;

  // Offer IDs
  let santanderOfferId: BankOfferId;
  let pkoBpOfferId: BankOfferId;

  beforeEach(() => {
    tierRepo = new InMemoryTierRepository();
    bankOfferRepo = new InMemoryBankOfferRepository();
    creditOfferRepo = new InMemoryCreditOfferRepository();
    agreementRepo = new InMemoryCreditAgreementRepository();

    // Create tiers for Santander
    santanderLowTierId = TierId.generate();
    santanderMidTierId = TierId.generate();

    tierRepo.save(new Tier({
      id: santanderLowTierId,
      bankCode: bankCode('SANTANDER'),
      name: 'Santander Low',
      sector: 'PRIVATE',
      salaryRange: SalaryRange.of(3000, 6000),
      interestRate: Rate.of(0.095),
      maxDeductionRate: Rate.of(0.5),
      maxLoanToValue: Rate.of(0.7),
      minTerm: Months.of(12),
      maxTerm: Months.of(48),
      minDownPaymentRate: Rate.of(0.15),
      processingFee: Rate.of(0.025),
      insuranceRequired: true,
      metadata: {},
    }));

    tierRepo.save(new Tier({
      id: santanderMidTierId,
      bankCode: bankCode('SANTANDER'),
      name: 'Santander Mid',
      sector: 'PRIVATE',
      salaryRange: SalaryRange.of(6000, 12000),
      interestRate: Rate.of(0.075),
      maxDeductionRate: Rate.of(0.6),
      maxLoanToValue: Rate.of(0.85),
      minTerm: Months.of(12),
      maxTerm: Months.of(72),
      minDownPaymentRate: Rate.of(0.1),
      processingFee: Rate.of(0.02),
      insuranceRequired: true,
      metadata: {},
    }));

    // Create tier for PKO BP
    pkoBpTierId = TierId.generate();
    tierRepo.save(new Tier({
      id: pkoBpTierId,
      bankCode: bankCode('PKO_BP'),
      name: 'PKO Standard',
      sector: 'PRIVATE',
      salaryRange: SalaryRange.of(4000, 15000),
      interestRate: Rate.of(0.08),
      maxDeductionRate: Rate.of(0.55),
      maxLoanToValue: Rate.of(0.8),
      minTerm: Months.of(12),
      maxTerm: Months.of(60),
      minDownPaymentRate: Rate.of(0.1),
      processingFee: Rate.of(0.015),
      insuranceRequired: false,
      metadata: {},
    }));

    // Create bank offers
    santanderOfferId = BankOfferId.generate();
    bankOfferRepo.save(new BankOffer({
      id: santanderOfferId,
      bankCode: bankCode('SANTANDER'),
      displayName: 'Santander Summer 2024',
      description: 'Summer auto loan offer',
      sectors: [
        { sector: 'PRIVATE', tierIds: [santanderLowTierId, santanderMidTierId] },
      ],
      validFrom: '2024-06-01',
      validUntil: '2024-09-30',
      categories: ['auto'],
      metadata: {},
    }));

    pkoBpOfferId = BankOfferId.generate();
    bankOfferRepo.save(new BankOffer({
      id: pkoBpOfferId,
      bankCode: bankCode('PKO_BP'),
      displayName: 'PKO Auto Loan',
      description: 'Standard auto loan',
      sectors: [
        { sector: 'PRIVATE', tierIds: [pkoBpTierId] },
      ],
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      categories: ['auto'],
      metadata: {},
    }));

    // Build registry with bank-specific pipelines
    registry = new MapBankStrategyRegistry(new Map([
      ['SANTANDER', {
        tierMatcher: new DefaultTierMatchingPipeline([
          new SalaryRangeFilterStep(),
          new SectorFilterStep(),
          new TermFilterStep(),
          new DownPaymentFilterStep(),
          new SantanderCreditScoringStep(),
          new BestRateSelectionStep(),
        ]),
        calculator: new DefaultCreditCalculationPipeline([
          new AnnuityCalculationStep(),
          new InsuranceFeeStep(),
          new ProcessingFeeStep(),
        ]),
      }],
      ['PKO_BP', {
        tierMatcher: new DefaultTierMatchingPipeline([
          new SalaryRangeFilterStep(),
          new SectorFilterStep(),
          new TermFilterStep(),
          new DownPaymentFilterStep(),
          new BestRateSelectionStep(),
        ]),
        calculator: new DefaultCreditCalculationPipeline([
          new DecliningBalanceStep(),
          new ProcessingFeeStep(),
        ]),
      }],
    ]));

    calculateHandler = new CalculateCreditOfferHandler(
      bankOfferRepo, tierRepo, creditOfferRepo, registry,
    );
    acceptHandler = new AcceptCreditOfferHandler(creditOfferRepo);
    createAgreementHandler = new CreateAgreementHandler(
      creditOfferRepo, agreementRepo,
    );
  });

  it('calculates a Santander credit offer with annuity + insurance + processing fee', async () => {
    const result = await calculateHandler.execute(new CalculateCreditOfferCommand(
      santanderOfferId.value,
      'PRIVATE',
      'PERMANENT',
      8000,  // salary
      1500,  // obligations
      48,    // employment months
      80000, // vehicle price
      true,
      2024,
      36,    // term
      16000, // down payment
    ));

    expect(result.isSuccess()).toBe(true);
    const offerId = result.getValue();

    const offer = creditOfferRepo.findById(CreditOfferId.of(offerId));
    expect(offer).toBeDefined();
    expect(offer!.status).toBe('DRAFT');
    expect(offer!.tierId).toBe(santanderMidTierId.value); // Mid tier (salary 8000 matches 6000-12000)
    expect(offer!.creditAmount.amount).toBe(64000);
    expect(offer!.monthlyPayment.amount).toBeGreaterThan(0);
    expect(offer!.extras['insurance']).toBeDefined();
    expect(offer!.extras['processingFee']).toBeDefined();
  });

  it('calculates a PKO BP credit offer with declining balance + no insurance', async () => {
    const result = await calculateHandler.execute(new CalculateCreditOfferCommand(
      pkoBpOfferId.value,
      'PRIVATE',
      'PERMANENT',
      8000,
      1000,
      60,
      80000,
      true,
      2024,
      48,
      16000,
    ));

    expect(result.isSuccess()).toBe(true);
    const offerId = result.getValue();

    const offer = creditOfferRepo.findById(CreditOfferId.of(offerId));
    expect(offer).toBeDefined();
    expect(offer!.tierId).toBe(pkoBpTierId.value);
    expect(offer!.extras['insurance']).toBeUndefined(); // PKO tier has insuranceRequired=false
    expect(offer!.extras['processingFee']).toBeDefined();
  });

  it('different banks produce different calculations for same customer', async () => {
    const cmd = (offerId: string) => new CalculateCreditOfferCommand(
      offerId, 'PRIVATE', 'PERMANENT', 8000, 1000, 48, 80000, true, 2024, 36, 16000,
    );

    const santanderResult = await calculateHandler.execute(cmd(santanderOfferId.value));
    const pkoResult = await calculateHandler.execute(cmd(pkoBpOfferId.value));

    expect(santanderResult.isSuccess()).toBe(true);
    expect(pkoResult.isSuccess()).toBe(true);

    const santanderOffer = creditOfferRepo.findById(CreditOfferId.of(santanderResult.getValue()));
    const pkoOffer = creditOfferRepo.findById(CreditOfferId.of(pkoResult.getValue()));

    // Different banks, different calculation methods → different monthly payments
    expect(santanderOffer!.monthlyPayment.amount).not.toBe(pkoOffer!.monthlyPayment.amount);
    // Santander uses annuity (equal payments), PKO uses declining balance (first payment higher)
    expect(pkoOffer!.monthlyPayment.amount).toBeGreaterThan(santanderOffer!.monthlyPayment.amount);
  });

  it('full flow: calculate → accept → create agreement', async () => {
    // 1. Calculate
    const calcResult = await calculateHandler.execute(new CalculateCreditOfferCommand(
      santanderOfferId.value,
      'PRIVATE',
      'PERMANENT',
      8000,
      1000,
      48,
      80000,
      true,
      2024,
      36,
      16000,
    ));
    expect(calcResult.isSuccess()).toBe(true);
    const creditOfferId = calcResult.getValue();

    // 2. Accept
    const acceptResult = await acceptHandler.execute(
      new AcceptCreditOfferCommand(creditOfferId),
    );
    expect(acceptResult.isSuccess()).toBe(true);

    const acceptedOffer = creditOfferRepo.findById(CreditOfferId.of(creditOfferId));
    expect(acceptedOffer!.status).toBe('ACCEPTED');

    // 3. Create agreement
    const agreementResult = await createAgreementHandler.execute(
      new CreateAgreementCommand(creditOfferId),
    );
    expect(agreementResult.isSuccess()).toBe(true);

    const agreements = agreementRepo.findAll();
    expect(agreements).toHaveLength(1);

    const agreement = agreements[0];
    expect(agreement.status).toBe('ACTIVE');
    expect(agreement.creditAmount.amount).toBe(64000);
    expect(agreement.agreementNumber).toContain('SANTANDER');
  });

  it('fails when bank offer not found', async () => {
    const result = await calculateHandler.execute(new CalculateCreditOfferCommand(
      'non-existent',
      'PRIVATE',
      'PERMANENT',
      8000,
      1000,
      48,
      80000,
      true,
      2024,
      36,
      16000,
    ));
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('not found');
  });

  it('fails when no tiers match', async () => {
    // Very low salary — no tier matches
    const result = await calculateHandler.execute(new CalculateCreditOfferCommand(
      santanderOfferId.value,
      'PRIVATE',
      'PERMANENT',
      1000,  // too low for any tier
      0,
      48,
      80000,
      true,
      2024,
      36,
      16000,
    ));
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('No matching tier');
  });

  it('cannot create agreement from non-ACCEPTED offer', async () => {
    const calcResult = await calculateHandler.execute(new CalculateCreditOfferCommand(
      santanderOfferId.value,
      'PRIVATE',
      'PERMANENT',
      8000,
      1000,
      48,
      80000,
      true,
      2024,
      36,
      16000,
    ));
    expect(calcResult.isSuccess()).toBe(true);

    // Try to create agreement without accepting first
    const agreementResult = await createAgreementHandler.execute(
      new CreateAgreementCommand(calcResult.getValue()),
    );
    expect(agreementResult.isFailure()).toBe(true);
    expect(agreementResult.getError()).toContain('must be ACCEPTED');
  });
});
