import { BankCode } from '../../../shared/domain';
import { Money } from '../../../shared/domain/money';
import { Rate } from '../../../shared/domain/rate';
import { CreditOfferId } from './credit-offer-id';

export type CreditOfferStatus =
  | 'DRAFT'
  | 'PRESENTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WITHDRAWN';

export interface CreditOfferProps {
  id: CreditOfferId;
  bankCode: BankCode;
  tierId: string;
  bankOfferId: string;
  creditAmount: Money;
  monthlyPayment: Money;
  totalRepayment: Money;
  totalInterest: Money;
  effectiveInterestRate: Rate;
  termMonths: number;
  extras: Record<string, Money>;
  status: CreditOfferStatus;
  createdAt: string;
  expiresAt: string;
}

/**
 * CreditOffer — Entity with lifecycle.
 *
 * NOT a product — it's a quote/proposal resulting from calculation.
 * Has a lifecycle: DRAFT → PRESENTED → ACCEPTED/REJECTED/EXPIRED/WITHDRAWN.
 */
export class CreditOffer {
  readonly id: CreditOfferId;
  readonly bankCode: BankCode;
  readonly tierId: string;
  readonly bankOfferId: string;
  readonly creditAmount: Money;
  readonly monthlyPayment: Money;
  readonly totalRepayment: Money;
  readonly totalInterest: Money;
  readonly effectiveInterestRate: Rate;
  readonly termMonths: number;
  readonly extras: Record<string, Money>;
  private _status: CreditOfferStatus;
  readonly createdAt: string;
  readonly expiresAt: string;

  constructor(props: CreditOfferProps) {
    this.id = props.id;
    this.bankCode = props.bankCode;
    this.tierId = props.tierId;
    this.bankOfferId = props.bankOfferId;
    this.creditAmount = props.creditAmount;
    this.monthlyPayment = props.monthlyPayment;
    this.totalRepayment = props.totalRepayment;
    this.totalInterest = props.totalInterest;
    this.effectiveInterestRate = props.effectiveInterestRate;
    this.termMonths = props.termMonths;
    this.extras = { ...props.extras };
    this._status = props.status;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
  }

  get status(): CreditOfferStatus {
    return this._status;
  }

  present(): void {
    this.assertStatus('DRAFT', 'present');
    this._status = 'PRESENTED';
  }

  accept(): void {
    this.assertStatus('PRESENTED', 'accept');
    this._status = 'ACCEPTED';
  }

  reject(): void {
    this.assertStatus('PRESENTED', 'reject');
    this._status = 'REJECTED';
  }

  withdraw(): void {
    if (this._status === 'ACCEPTED' || this._status === 'REJECTED') {
      throw new Error(`Cannot withdraw an already ${this._status} offer`);
    }
    this._status = 'WITHDRAWN';
  }

  expire(): void {
    if (this._status !== 'DRAFT' && this._status !== 'PRESENTED') {
      throw new Error(`Cannot expire offer in status: ${this._status}`);
    }
    this._status = 'EXPIRED';
  }

  isActive(): boolean {
    return this._status === 'DRAFT' || this._status === 'PRESENTED';
  }

  private assertStatus(expected: CreditOfferStatus, action: string): void {
    if (this._status !== expected) {
      throw new Error(
        `Cannot ${action} offer in status: ${this._status} (expected: ${expected})`,
      );
    }
  }
}
