import { CreditOffer } from '../../src/credit-quoting/domain/model/credit-offer';
import { CreditOfferId } from '../../src/credit-quoting/domain/model/credit-offer-id';
import { Money } from '../../src/shared/domain/money';
import { Rate } from '../../src/shared/domain/rate';
import { bankCode } from '../../src/shared/domain/bank-code';

function createOffer() {
  return new CreditOffer({
    id: CreditOfferId.generate(),
    bankCode: bankCode('SANTANDER'),
    tierId: 'tier-1',
    bankOfferId: 'offer-1',
    creditAmount: Money.of(64000),
    monthlyPayment: Money.of(1947.26),
    totalRepayment: Money.of(70101.36),
    totalInterest: Money.of(6101.36),
    effectiveInterestRate: Rate.of(0.095),
    termMonths: 36,
    extras: {
      insurance: Money.of(1280),
      processingFee: Money.of(1280),
    },
    status: 'DRAFT',
    createdAt: '2024-07-01T10:00:00Z',
    expiresAt: '2024-07-31T10:00:00Z',
  });
}

describe('CreditOffer', () => {
  it('creates in DRAFT status', () => {
    const offer = createOffer();
    expect(offer.status).toBe('DRAFT');
    expect(offer.isActive()).toBe(true);
  });

  it('transitions DRAFT → PRESENTED → ACCEPTED', () => {
    const offer = createOffer();
    offer.present();
    expect(offer.status).toBe('PRESENTED');
    expect(offer.isActive()).toBe(true);

    offer.accept();
    expect(offer.status).toBe('ACCEPTED');
    expect(offer.isActive()).toBe(false);
  });

  it('transitions DRAFT → PRESENTED → REJECTED', () => {
    const offer = createOffer();
    offer.present();
    offer.reject();
    expect(offer.status).toBe('REJECTED');
  });

  it('cannot accept from DRAFT directly', () => {
    const offer = createOffer();
    expect(() => offer.accept()).toThrow('Cannot accept');
  });

  it('cannot reject from DRAFT directly', () => {
    const offer = createOffer();
    expect(() => offer.reject()).toThrow('Cannot reject');
  });

  it('can withdraw from DRAFT', () => {
    const offer = createOffer();
    offer.withdraw();
    expect(offer.status).toBe('WITHDRAWN');
  });

  it('can withdraw from PRESENTED', () => {
    const offer = createOffer();
    offer.present();
    offer.withdraw();
    expect(offer.status).toBe('WITHDRAWN');
  });

  it('cannot withdraw ACCEPTED offer', () => {
    const offer = createOffer();
    offer.present();
    offer.accept();
    expect(() => offer.withdraw()).toThrow('Cannot withdraw');
  });

  it('can expire DRAFT', () => {
    const offer = createOffer();
    offer.expire();
    expect(offer.status).toBe('EXPIRED');
  });

  it('can expire PRESENTED', () => {
    const offer = createOffer();
    offer.present();
    offer.expire();
    expect(offer.status).toBe('EXPIRED');
  });

  it('cannot expire ACCEPTED', () => {
    const offer = createOffer();
    offer.present();
    offer.accept();
    expect(() => offer.expire()).toThrow('Cannot expire');
  });

  it('stores financial details correctly', () => {
    const offer = createOffer();
    expect(offer.creditAmount.amount).toBe(64000);
    expect(offer.monthlyPayment.amount).toBe(1947.26);
    expect(offer.termMonths).toBe(36);
    expect(offer.extras['insurance'].amount).toBe(1280);
  });
});
