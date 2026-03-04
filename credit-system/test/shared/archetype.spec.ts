import {
  ProductType,
  CatalogEntry,
  ProductInstance,
  Validity,
  ProductMetadata,
  ApplicabilityConstraint,
  ApplicabilityContext,
  isSatisfiedBy,
  ProductFeatureType,
  ProductFeatureTypeDefinition,
  ProductFeatureTypes,
  ProductFeatureInstance,
  ProductFeatureInstances,
  FeatureValueType,
  AllowedValuesConstraint,
  NumericRangeConstraint,
  DecimalRangeConstraint,
} from '../../src/shared/domain/archetype';

import { Tier } from '../../src/product-catalog/domain/model/tier';
import { BankOffer } from '../../src/product-catalog/domain/model/bank-offer';
import { CreditAgreement } from '../../src/credit-agreement/domain/model/credit-agreement';
import { TierId } from '../../src/product-catalog/domain/value-objects/tier-id';
import { BankOfferId } from '../../src/product-catalog/domain/value-objects/bank-offer-id';
import { CreditAgreementId } from '../../src/credit-agreement/domain/model/credit-agreement-id';
import { SalaryRange } from '../../src/product-catalog/domain/value-objects/salary-range';
import { Rate, Money, Months, SANTANDER } from '../../src/shared/domain';

describe('Product Archetype — Abstract Layer', () => {
  // ─── Validity ─────────────────────────────────────────────────────────────

  describe('Validity', () => {
    it('between checks dates correctly', () => {
      const v = Validity.between('2024-01-01', '2024-12-31');
      expect(v.isValidAt('2024-06-15')).toBe(true);
      expect(v.isValidAt('2023-12-31')).toBe(false);
      expect(v.isValidAt('2025-01-01')).toBe(false);
    });

    it('always is valid for any date', () => {
      const v = Validity.always();
      expect(v.isValidAt('2024-06-15')).toBe(true);
      expect(v.isValidAt('1900-01-01')).toBe(true);
    });

    it('fromDate checks open-ended validity', () => {
      const v = Validity.fromDate('2024-01-01');
      expect(v.isValidAt('2024-01-01')).toBe(true);
      expect(v.isValidAt('2099-12-31')).toBe(true);
      expect(v.isValidAt('2023-12-31')).toBe(false);
    });
  });

  // ─── ProductMetadata ──────────────────────────────────────────────────────

  describe('ProductMetadata', () => {
    it('supports copy-on-write with()', () => {
      const m1 = ProductMetadata.of({ brand: 'Santander' });
      const m2 = m1.with('campaign', '2024');
      expect(m1.has('campaign')).toBe(false);
      expect(m2.get('campaign')).toBe('2024');
      expect(m2.get('brand')).toBe('Santander');
    });
  });

  // ─── ApplicabilityConstraint ──────────────────────────────────────────────

  describe('ApplicabilityConstraint', () => {
    it('evaluates composed constraints', () => {
      const constraint = ApplicabilityConstraint.and(
        ApplicabilityConstraint.equalsTo('country', 'PL'),
        ApplicabilityConstraint.between('age', 18, 65),
        ApplicabilityConstraint.in('channel', 'web', 'mobile'),
      );

      const matchCtx = ApplicabilityContext.of({
        country: 'PL',
        age: '30',
        channel: 'web',
      });
      expect(isSatisfiedBy(constraint, matchCtx)).toBe(true);

      const noMatch = ApplicabilityContext.of({
        country: 'DE',
        age: '30',
        channel: 'web',
      });
      expect(isSatisfiedBy(constraint, noMatch)).toBe(false);
    });

    it('alwaysTrue matches everything', () => {
      expect(
        isSatisfiedBy(
          ApplicabilityConstraint.alwaysTrue(),
          ApplicabilityContext.empty(),
        ),
      ).toBe(true);
    });
  });

  // ─── ProductFeatureType / ProductFeatureInstance ───────────────────────────

  describe('Features', () => {
    it('creates and validates feature types with constraints', () => {
      const insuranceType = ProductFeatureType.withAllowedValues(
        'insurancePackage',
        'BASIC',
        'PREMIUM',
        'NONE',
      );
      expect(insuranceType.isValidValue('BASIC')).toBe(true);
      expect(insuranceType.isValidValue('INVALID')).toBe(false);

      const ltvRange = ProductFeatureType.withDecimalRange('loanToValue', 0, 1);
      expect(ltvRange.isValidValue(0.8)).toBe(true);
      expect(ltvRange.isValidValue(1.5)).toBe(false);
    });

    it('creates feature instances with validated values', () => {
      const colorType = ProductFeatureType.withAllowedValues(
        'color',
        'red',
        'blue',
      );
      const instance = ProductFeatureInstance.of(colorType, 'red');
      expect(instance.asString()).toBe('red');
      expect(() => ProductFeatureInstance.of(colorType, 'green')).toThrow();
    });

    it('validates mandatory features in ProductFeatureInstances', () => {
      const riskLevel = ProductFeatureType.withAllowedValues(
        'riskLevel',
        'LOW',
        'MEDIUM',
        'HIGH',
      );
      const featureTypes = ProductFeatureTypes.of(
        ProductFeatureTypeDefinition.mandatoryOf(riskLevel),
      );
      const noFeatures = ProductFeatureInstances.empty();
      expect(() => noFeatures.validateAgainst(featureTypes)).toThrow(
        "Mandatory feature 'riskLevel' is missing",
      );

      const withFeatures = ProductFeatureInstances.of(
        ProductFeatureInstance.of(riskLevel, 'LOW'),
      );
      expect(() => withFeatures.validateAgainst(featureTypes)).not.toThrow();
    });
  });

  // ─── Tier instanceof ProductType ──────────────────────────────────────────

  describe('Tier extends ProductType', () => {
    it('is an instance of ProductType', () => {
      const tier = new Tier({
        id: TierId.generate(),
        bankCode: SANTANDER,
        name: 'Premium 10-20k',
        sector: 'PRIVATE',
        salaryRange: SalaryRange.of(10_000, 20_000),
        interestRate: Rate.of(0.05),
        maxDeductionRate: Rate.of(0.5),
        maxLoanToValue: Rate.of(0.9),
        minTerm: Months.of(12),
        maxTerm: Months.of(60),
        minDownPaymentRate: Rate.of(0.1),
        processingFee: Rate.of(0.02),
        insuranceRequired: true,
        metadata: { campaign: '2024' },
      });
      expect(tier).toBeInstanceOf(ProductType);
      expect(tier.featureTypes.isEmpty).toBe(true);
      expect(tier.applicabilityConstraint.kind).toBe('alwaysTrue');
    });

    it('supports feature types', () => {
      const insuranceType = ProductFeatureType.withAllowedValues(
        'insurancePackage',
        'BASIC',
        'PREMIUM',
      );
      const tier = new Tier({
        id: TierId.generate(),
        bankCode: SANTANDER,
        name: 'With features',
        sector: 'PRIVATE',
        salaryRange: SalaryRange.of(5_000, 15_000),
        interestRate: Rate.of(0.06),
        maxDeductionRate: Rate.of(0.5),
        maxLoanToValue: Rate.of(0.8),
        minTerm: Months.of(12),
        maxTerm: Months.of(48),
        minDownPaymentRate: Rate.of(0.1),
        processingFee: Rate.of(0.02),
        insuranceRequired: false,
        metadata: {},
        featureTypes: ProductFeatureTypes.of(
          ProductFeatureTypeDefinition.mandatoryOf(insuranceType),
        ),
      });
      expect(tier.featureTypes.size).toBe(1);
      expect(tier.featureTypes.isMandatory('insurancePackage')).toBe(true);
    });

    it('supports applicability constraints', () => {
      const constraint = ApplicabilityConstraint.equalsTo('country', 'PL');
      const tier = new Tier({
        id: TierId.generate(),
        bankCode: SANTANDER,
        name: 'PL Only',
        sector: 'PRIVATE',
        salaryRange: SalaryRange.of(5_000, 15_000),
        interestRate: Rate.of(0.06),
        maxDeductionRate: Rate.of(0.5),
        maxLoanToValue: Rate.of(0.8),
        minTerm: Months.of(12),
        maxTerm: Months.of(48),
        minDownPaymentRate: Rate.of(0.1),
        processingFee: Rate.of(0.02),
        insuranceRequired: false,
        metadata: {},
        applicabilityConstraint: constraint,
      });
      expect(
        isSatisfiedBy(
          tier.applicabilityConstraint,
          ApplicabilityContext.of({ country: 'PL' }),
        ),
      ).toBe(true);
      expect(
        isSatisfiedBy(
          tier.applicabilityConstraint,
          ApplicabilityContext.of({ country: 'DE' }),
        ),
      ).toBe(false);
    });
  });

  // ─── BankOffer instanceof CatalogEntry ────────────────────────────────────

  describe('BankOffer extends CatalogEntry', () => {
    it('is an instance of CatalogEntry with Validity', () => {
      const offer = new BankOffer({
        id: BankOfferId.generate(),
        bankCode: SANTANDER,
        displayName: 'Santander Auto Credit',
        description: 'Best rates on auto loans',
        sectors: [{ sector: 'PRIVATE', tierIds: [TierId.generate()] }],
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        categories: ['auto-loans', 'premium'],
        metadata: { campaign: 'summer2024' },
      });
      expect(offer).toBeInstanceOf(CatalogEntry);
      expect(offer.isAvailableAt('2024-06-15')).toBe(true);
      expect(offer.isAvailableAt('2025-01-01')).toBe(false);
      expect(offer.isInCategory('auto-loans')).toBe(true);
      expect(offer.isInCategory('mortgage')).toBe(false);
      expect(offer.validity).toBeInstanceOf(Validity);
    });
  });

  // ─── CreditAgreement instanceof ProductInstance ───────────────────────────

  describe('CreditAgreement extends ProductInstance', () => {
    it('is an instance of ProductInstance', () => {
      const tierId = TierId.generate().value;
      const agreement = new CreditAgreement({
        id: CreditAgreementId.generate(),
        agreementNumber: 'SANTANDER/2024/000001',
        bankCode: SANTANDER,
        creditOfferId: 'offer-123',
        tierId,
        creditAmount: Money.of(50_000),
        monthlyPayment: Money.of(1_200),
        interestRate: Rate.of(0.05),
        termMonths: 48,
        status: 'ACTIVE',
        signedAt: '2024-06-15',
      });
      expect(agreement).toBeInstanceOf(ProductInstance);
      expect(agreement.productTypeId).toBe(tierId);
      expect(agreement.features.size).toBe(0);
    });

    it('supports feature instances (frozen at signing)', () => {
      const insuranceType = ProductFeatureType.withAllowedValues(
        'insurancePackage',
        'BASIC',
        'PREMIUM',
      );
      const agreement = new CreditAgreement({
        id: CreditAgreementId.generate(),
        agreementNumber: 'SANTANDER/2024/000002',
        bankCode: SANTANDER,
        creditOfferId: 'offer-456',
        tierId: TierId.generate().value,
        creditAmount: Money.of(80_000),
        monthlyPayment: Money.of(2_000),
        interestRate: Rate.of(0.04),
        termMonths: 60,
        status: 'ACTIVE',
        signedAt: '2024-06-15',
        features: ProductFeatureInstances.of(
          ProductFeatureInstance.of(insuranceType, 'PREMIUM'),
        ),
      });
      expect(agreement.features.size).toBe(1);
      expect(agreement.features.get('insurancePackage')?.asString()).toBe(
        'PREMIUM',
      );
    });
  });
});
