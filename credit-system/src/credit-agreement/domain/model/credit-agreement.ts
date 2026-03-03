import { BankCode } from '../../../shared/domain';
import { Money } from '../../../shared/domain/money';
import { Rate } from '../../../shared/domain/rate';
import { CreditAgreementId } from './credit-agreement-id';

export type CreditAgreementStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DEFAULTED'
  | 'TERMINATED';

export interface CreditAgreementProps {
  id: CreditAgreementId;
  agreementNumber: string;
  bankCode: BankCode;
  creditOfferId: string;
  tierId: string;
  creditAmount: Money;
  monthlyPayment: Money;
  interestRate: Rate;
  termMonths: number;
  status: CreditAgreementStatus;
  signedAt: string;
}

/**
 * CreditAgreement = ProductInstance in the Product Archetype.
 *
 * A concrete credit agreement created after a CreditOffer is accepted.
 * Financial parameters are frozen at the moment of signing.
 */
export class CreditAgreement {
  readonly id: CreditAgreementId;
  readonly agreementNumber: string;
  readonly bankCode: BankCode;
  readonly creditOfferId: string;
  readonly tierId: string;
  readonly creditAmount: Money;
  readonly monthlyPayment: Money;
  readonly interestRate: Rate;
  readonly termMonths: number;
  private _status: CreditAgreementStatus;
  readonly signedAt: string;

  constructor(props: CreditAgreementProps) {
    if (!props.agreementNumber || props.agreementNumber.trim().length === 0) {
      throw new Error('Agreement number cannot be empty');
    }
    this.id = props.id;
    this.agreementNumber = props.agreementNumber;
    this.bankCode = props.bankCode;
    this.creditOfferId = props.creditOfferId;
    this.tierId = props.tierId;
    this.creditAmount = props.creditAmount;
    this.monthlyPayment = props.monthlyPayment;
    this.interestRate = props.interestRate;
    this.termMonths = props.termMonths;
    this._status = props.status;
    this.signedAt = props.signedAt;
  }

  get status(): CreditAgreementStatus {
    return this._status;
  }

  complete(): void {
    this.assertStatus('ACTIVE', 'complete');
    this._status = 'COMPLETED';
  }

  markDefaulted(): void {
    this.assertStatus('ACTIVE', 'default');
    this._status = 'DEFAULTED';
  }

  terminate(): void {
    this.assertStatus('ACTIVE', 'terminate');
    this._status = 'TERMINATED';
  }

  private assertStatus(
    expected: CreditAgreementStatus,
    action: string,
  ): void {
    if (this._status !== expected) {
      throw new Error(
        `Cannot ${action} agreement in status: ${this._status} (expected: ${expected})`,
      );
    }
  }
}
