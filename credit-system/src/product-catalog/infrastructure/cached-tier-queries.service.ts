import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { bankCode } from '../../shared/domain';
import { TierId } from '../domain/value-objects/tier-id';
import { Tier } from '../domain/model/tier';
import { TIER_REPOSITORY } from '../domain/repository/tier.repository';
import type { TierRepository } from '../domain/repository/tier.repository';
import type { TierView } from '../application/views/tier.view';

function toTierView(tier: Tier): TierView {
  return {
    id: tier.id.value,
    bankCode: tier.bankCode as string,
    name: tier.name,
    sector: tier.sector,
    salaryMin: tier.salaryRange.min,
    salaryMax: tier.salaryRange.max,
    interestRate: tier.interestRate.value,
    maxDeductionRate: tier.maxDeductionRate.value,
    maxLoanToValue: tier.maxLoanToValue.value,
    minTermMonths: tier.minTerm.value,
    maxTermMonths: tier.maxTerm.value,
    minDownPaymentRate: tier.minDownPaymentRate.value,
    processingFee: tier.processingFee.value,
    insuranceRequired: tier.insuranceRequired,
    metadata: { ...tier.metadata },
  };
}

@Injectable()
export class CachedTierQueriesService {
  constructor(
    @Inject(TIER_REPOSITORY)
    private readonly tierRepo: TierRepository,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async findById(tierId: string): Promise<TierView | undefined> {
    const cacheKey = `tier:${tierId}`;
    const cached = await this.cache.get<TierView>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`, 'CachedTierQueries');
      return cached;
    }

    this.logger.log(`Cache MISS: ${cacheKey}`, 'CachedTierQueries');
    const tier = this.tierRepo.findById(TierId.of(tierId));
    if (!tier) return undefined;

    const view = toTierView(tier);
    await this.cache.set(cacheKey, view);
    return view;
  }

  async findByBank(bankCodeStr: string): Promise<TierView[]> {
    const cacheKey = `tiers:bank:${bankCodeStr}`;
    const cached = await this.cache.get<TierView[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`, 'CachedTierQueries');
      return cached;
    }

    this.logger.log(`Cache MISS: ${cacheKey}`, 'CachedTierQueries');
    const tiers = this.tierRepo.findByBank(bankCode(bankCodeStr));
    const views = tiers.map(toTierView);
    await this.cache.set(cacheKey, views);
    return views;
  }

  async invalidateBank(bankCodeStr: string): Promise<void> {
    await this.cache.del(`tiers:bank:${bankCodeStr}`);
    this.logger.log(`Cache invalidated: tiers:bank:${bankCodeStr}`, 'CachedTierQueries');
  }

  async invalidateTier(tierId: string): Promise<void> {
    await this.cache.del(`tier:${tierId}`);
    this.logger.log(`Cache invalidated: tier:${tierId}`, 'CachedTierQueries');
  }
}
