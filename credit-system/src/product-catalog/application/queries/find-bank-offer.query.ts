import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { bankCode } from '../../../shared/domain';
import { BankOfferId } from '../../domain/value-objects/bank-offer-id';
import { BankOffer } from '../../domain/model/bank-offer';
import { BANK_OFFER_REPOSITORY } from '../../domain/repository/bank-offer.repository';
import type { BankOfferRepository } from '../../domain/repository/bank-offer.repository';
import type { BankOfferView } from '../views/tier.view';

export class FindBankOfferByIdQuery implements IQuery {
  constructor(public readonly bankOfferId: string) {}
}

export class FindBankOffersByBankQuery implements IQuery {
  constructor(public readonly bankCode: string) {}
}

@QueryHandler(FindBankOfferByIdQuery)
export class FindBankOfferByIdHandler
  implements IQueryHandler<FindBankOfferByIdQuery>
{
  constructor(
    @Inject(BANK_OFFER_REPOSITORY)
    private readonly bankOfferRepository: BankOfferRepository,
  ) {}

  async execute(query: FindBankOfferByIdQuery): Promise<BankOfferView | undefined> {
    const offer = this.bankOfferRepository.findById(
      BankOfferId.of(query.bankOfferId),
    );
    return offer ? toBankOfferView(offer) : undefined;
  }
}

@QueryHandler(FindBankOffersByBankQuery)
export class FindBankOffersByBankHandler
  implements IQueryHandler<FindBankOffersByBankQuery>
{
  constructor(
    @Inject(BANK_OFFER_REPOSITORY)
    private readonly bankOfferRepository: BankOfferRepository,
  ) {}

  async execute(query: FindBankOffersByBankQuery): Promise<BankOfferView[]> {
    return this.bankOfferRepository
      .findByBank(bankCode(query.bankCode))
      .map(toBankOfferView);
  }
}

function toBankOfferView(offer: BankOffer): BankOfferView {
  return {
    id: offer.id.value,
    bankCode: offer.bankCode as string,
    displayName: offer.displayName,
    description: offer.description,
    sectors: offer.sectors.map((s) => ({
      sector: s.sector,
      tierIds: s.tierIds.map((t) => t.value),
    })),
    validFrom: offer.validFrom,
    validUntil: offer.validUntil,
    categories: [...offer.categories],
    metadata: { ...offer.metadata },
  };
}
