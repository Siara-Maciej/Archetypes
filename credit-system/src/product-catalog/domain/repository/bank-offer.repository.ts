import { BankCode } from '../../../shared/domain';
import { BankOfferId } from '../value-objects/bank-offer-id';
import { BankOffer } from '../model/bank-offer';

export const BANK_OFFER_REPOSITORY = Symbol('BankOfferRepository');

export interface BankOfferRepository {
  save(offer: BankOffer): void;
  findById(id: BankOfferId): BankOffer | undefined;
  findAll(): BankOffer[];
  findByBank(bankCode: BankCode): BankOffer[];
  findByCategory(category: string): BankOffer[];
  findAvailableAt(date: string): BankOffer[];
  remove(id: BankOfferId): void;
}
