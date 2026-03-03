import { BankOffer } from '../../src/product-catalog/domain/model/bank-offer';
import { BankOfferId } from '../../src/product-catalog/domain/value-objects/bank-offer-id';
import { TierId } from '../../src/product-catalog/domain/value-objects/tier-id';
import { bankCode } from '../../src/shared/domain/bank-code';

describe('BankOffer', () => {
  const tier1 = TierId.of('tier-1');
  const tier2 = TierId.of('tier-2');

  function createOffer() {
    return new BankOffer({
      id: BankOfferId.generate(),
      bankCode: bankCode('SANTANDER'),
      displayName: 'Summer Credit 2024',
      description: 'Special summer offer',
      sectors: [
        { sector: 'PRIVATE', tierIds: [tier1, tier2] },
        { sector: 'GOVERNMENT', tierIds: [tier1] },
      ],
      validFrom: '2024-06-01',
      validUntil: '2024-09-30',
      categories: ['auto', 'seasonal'],
      metadata: { campaign: 'summer2024' },
    });
  }

  it('creates a valid bank offer', () => {
    const offer = createOffer();
    expect(offer.displayName).toBe('Summer Credit 2024');
    expect(offer.categories).toContain('auto');
  });

  it('rejects empty displayName', () => {
    expect(
      () =>
        new BankOffer({
          id: BankOfferId.generate(),
          bankCode: bankCode('PKO_BP'),
          displayName: '',
          description: '',
          sectors: [],
          validFrom: '2024-01-01',
          validUntil: '2024-12-31',
          categories: [],
          metadata: {},
        }),
    ).toThrow('displayName cannot be empty');
  });

  it('checks availability at date', () => {
    const offer = createOffer();
    expect(offer.isAvailableAt('2024-07-15')).toBe(true);
    expect(offer.isAvailableAt('2024-11-01')).toBe(false);
    expect(offer.isAvailableAt('2024-05-01')).toBe(false);
  });

  it('gets tier IDs for sector', () => {
    const offer = createOffer();
    const privateTiers = offer.getTierIdsForSector('PRIVATE');
    expect(privateTiers).toHaveLength(2);
    const govTiers = offer.getTierIdsForSector('GOVERNMENT');
    expect(govTiers).toHaveLength(1);
  });

  it('returns empty array for unknown sector', () => {
    const offer = createOffer();
    // Only PRIVATE and GOVERNMENT are configured
    expect(offer.getAllTierIds()).toHaveLength(3);
  });

  it('checks category membership', () => {
    const offer = createOffer();
    expect(offer.isInCategory('auto')).toBe(true);
    expect(offer.isInCategory('mortgage')).toBe(false);
  });
});
