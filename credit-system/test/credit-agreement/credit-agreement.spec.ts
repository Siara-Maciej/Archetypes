import { CreditAgreement } from '../../src/credit-agreement/domain/model/credit-agreement';
import { CreditAgreementId } from '../../src/credit-agreement/domain/model/credit-agreement-id';
import { Money } from '../../src/shared/domain/money';
import { Rate } from '../../src/shared/domain/rate';
import { bankCode } from '../../src/shared/domain/bank-code';

function createAgreement() {
  return new CreditAgreement({
    id: CreditAgreementId.generate(),
    agreementNumber: 'SANTANDER/2024/000001',
    bankCode: bankCode('SANTANDER'),
    creditOfferId: 'offer-1',
    tierId: 'tier-1',
    creditAmount: Money.of(64000),
    monthlyPayment: Money.of(1947.26),
    interestRate: Rate.of(0.095),
    termMonths: 36,
    status: 'ACTIVE',
    signedAt: '2024-07-15T14:00:00Z',
  });
}

describe('CreditAgreement', () => {
  it('creates in ACTIVE status', () => {
    const agreement = createAgreement();
    expect(agreement.status).toBe('ACTIVE');
    expect(agreement.agreementNumber).toBe('SANTANDER/2024/000001');
  });

  it('rejects empty agreement number', () => {
    expect(
      () =>
        new CreditAgreement({
          id: CreditAgreementId.generate(),
          agreementNumber: '',
          bankCode: bankCode('SANTANDER'),
          creditOfferId: 'offer-1',
          tierId: 'tier-1',
          creditAmount: Money.of(64000),
          monthlyPayment: Money.of(1947.26),
          interestRate: Rate.of(0.095),
          termMonths: 36,
          status: 'ACTIVE',
          signedAt: '2024-07-15T14:00:00Z',
        }),
    ).toThrow('Agreement number cannot be empty');
  });

  it('can be completed', () => {
    const agreement = createAgreement();
    agreement.complete();
    expect(agreement.status).toBe('COMPLETED');
  });

  it('can be marked as defaulted', () => {
    const agreement = createAgreement();
    agreement.markDefaulted();
    expect(agreement.status).toBe('DEFAULTED');
  });

  it('can be terminated', () => {
    const agreement = createAgreement();
    agreement.terminate();
    expect(agreement.status).toBe('TERMINATED');
  });

  it('cannot complete a non-ACTIVE agreement', () => {
    const agreement = createAgreement();
    agreement.complete();
    expect(() => agreement.complete()).toThrow('Cannot complete');
  });

  it('freezes financial parameters from the offer', () => {
    const agreement = createAgreement();
    expect(agreement.creditAmount.amount).toBe(64000);
    expect(agreement.monthlyPayment.amount).toBe(1947.26);
    expect(agreement.interestRate.value).toBe(0.095);
    expect(agreement.termMonths).toBe(36);
  });
});
