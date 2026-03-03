import { Injectable } from '@nestjs/common';
import { BankCode } from '../../shared/domain';
import { BankOfferId } from '../domain/value-objects/bank-offer-id';
import { BankOffer } from '../domain/model/bank-offer';
import { BankOfferRepository } from '../domain/repository/bank-offer.repository';

@Injectable()
export class InMemoryBankOfferRepository implements BankOfferRepository {
  private readonly storage = new Map<string, BankOffer>();

  save(offer: BankOffer): void {
    this.storage.set(offer.id.value, offer);
  }

  findById(id: BankOfferId): BankOffer | undefined {
    return this.storage.get(id.value);
  }

  findAll(): BankOffer[] {
    return [...this.storage.values()];
  }

  findByBank(bankCode: BankCode): BankOffer[] {
    return [...this.storage.values()].filter((o) => o.bankCode === bankCode);
  }

  findByCategory(category: string): BankOffer[] {
    return [...this.storage.values()].filter((o) => o.isInCategory(category));
  }

  findAvailableAt(date: string): BankOffer[] {
    return [...this.storage.values()].filter((o) => o.isAvailableAt(date));
  }

  remove(id: BankOfferId): void {
    this.storage.delete(id.value);
  }
}
