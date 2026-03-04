import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CreditOffer } from '../../domain/model/credit-offer';
import { CREDIT_OFFER_REPOSITORY } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferView } from '../../application/views/credit-offer.view';

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

@Injectable()
export class CachedCreditOfferQueriesService {
  constructor(
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async findById(creditOfferId: string): Promise<CreditOfferView | undefined> {
    const cacheKey = `credit-offer:${creditOfferId}`;
    const cached = await this.cache.get<CreditOfferView>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`, 'CachedCreditOfferQueries');
      return cached;
    }

    this.logger.log(`Cache MISS: ${cacheKey}`, 'CachedCreditOfferQueries');
    const offer = this.creditOfferRepo.findById(CreditOfferId.of(creditOfferId));
    if (!offer) return undefined;

    const view = toCreditOfferView(offer);
    await this.cache.set(cacheKey, view);
    return view;
  }

  async invalidate(creditOfferId: string): Promise<void> {
    await this.cache.del(`credit-offer:${creditOfferId}`);
    this.logger.log(
      `Cache invalidated: credit-offer:${creditOfferId}`,
      'CachedCreditOfferQueries',
    );
  }
}
