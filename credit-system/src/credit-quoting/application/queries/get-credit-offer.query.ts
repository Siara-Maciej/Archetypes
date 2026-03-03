import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CreditOffer } from '../../domain/model/credit-offer';
import { CREDIT_OFFER_REPOSITORY } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferView } from '../views/credit-offer.view';

export class GetCreditOfferQuery implements IQuery {
  constructor(public readonly creditOfferId: string) {}
}

export class ListActiveCreditOffersQuery implements IQuery {}

@QueryHandler(GetCreditOfferQuery)
export class GetCreditOfferHandler
  implements IQueryHandler<GetCreditOfferQuery>
{
  constructor(
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
  ) {}

  async execute(query: GetCreditOfferQuery): Promise<CreditOfferView | undefined> {
    const offer = this.creditOfferRepo.findById(
      CreditOfferId.of(query.creditOfferId),
    );
    return offer ? toCreditOfferView(offer) : undefined;
  }
}

@QueryHandler(ListActiveCreditOffersQuery)
export class ListActiveCreditOffersHandler
  implements IQueryHandler<ListActiveCreditOffersQuery>
{
  constructor(
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
  ) {}

  async execute(): Promise<CreditOfferView[]> {
    return this.creditOfferRepo.findActive().map(toCreditOfferView);
  }
}

function toCreditOfferView(offer: CreditOffer): CreditOfferView {
  const extras: Record<string, number> = {};
  for (const [key, money] of Object.entries(offer.extras)) {
    extras[key] = money.amount;
  }

  return {
    id: offer.id.value,
    bankCode: offer.bankCode as string,
    tierId: offer.tierId,
    bankOfferId: offer.bankOfferId,
    creditAmount: offer.creditAmount.amount,
    monthlyPayment: offer.monthlyPayment.amount,
    totalRepayment: offer.totalRepayment.amount,
    totalInterest: offer.totalInterest.amount,
    effectiveInterestRate: offer.effectiveInterestRate.value,
    termMonths: offer.termMonths,
    extras,
    status: offer.status,
    createdAt: offer.createdAt,
    expiresAt: offer.expiresAt,
    currency: offer.creditAmount.currency,
  };
}
