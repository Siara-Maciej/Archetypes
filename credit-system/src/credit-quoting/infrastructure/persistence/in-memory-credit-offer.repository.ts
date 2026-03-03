import { Injectable } from '@nestjs/common';
import { BankCode } from '../../../shared/domain';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CreditOffer } from '../../domain/model/credit-offer';
import { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';

@Injectable()
export class InMemoryCreditOfferRepository implements CreditOfferRepository {
  private readonly storage = new Map<string, CreditOffer>();

  save(offer: CreditOffer): void {
    this.storage.set(offer.id.value, offer);
  }

  findById(id: CreditOfferId): CreditOffer | undefined {
    return this.storage.get(id.value);
  }

  findAll(): CreditOffer[] {
    return [...this.storage.values()];
  }

  findByBank(bankCode: BankCode): CreditOffer[] {
    return [...this.storage.values()].filter((o) => o.bankCode === bankCode);
  }

  findActive(): CreditOffer[] {
    return [...this.storage.values()].filter((o) => o.isActive());
  }

  remove(id: CreditOfferId): void {
    this.storage.delete(id.value);
  }
}
