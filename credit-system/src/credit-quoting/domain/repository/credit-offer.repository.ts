import { BankCode } from '../../../shared/domain';
import { CreditOfferId } from '../model/credit-offer-id';
import { CreditOffer } from '../model/credit-offer';

export const CREDIT_OFFER_REPOSITORY = Symbol('CreditOfferRepository');

export interface CreditOfferRepository {
  save(offer: CreditOffer): void;
  findById(id: CreditOfferId): CreditOffer | undefined;
  findAll(): CreditOffer[];
  findByBank(bankCode: BankCode): CreditOffer[];
  findActive(): CreditOffer[];
  remove(id: CreditOfferId): void;
}
