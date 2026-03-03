import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { bankCode } from '../../../shared/domain';
import { TierId } from '../../domain/value-objects/tier-id';
import { Tier } from '../../domain/model/tier';
import { TIER_REPOSITORY } from '../../domain/repository/tier.repository';
import type { TierRepository } from '../../domain/repository/tier.repository';
import type { TierView } from '../views/tier.view';

export class FindTierByIdQuery implements IQuery {
  constructor(public readonly tierId: string) {}
}

export class FindTiersByBankQuery implements IQuery {
  constructor(public readonly bankCode: string) {}
}

@QueryHandler(FindTierByIdQuery)
export class FindTierByIdHandler implements IQueryHandler<FindTierByIdQuery> {
  constructor(
    @Inject(TIER_REPOSITORY)
    private readonly tierRepository: TierRepository,
  ) {}

  async execute(query: FindTierByIdQuery): Promise<TierView | undefined> {
    const tier = this.tierRepository.findById(TierId.of(query.tierId));
    return tier ? toTierView(tier) : undefined;
  }
}

@QueryHandler(FindTiersByBankQuery)
export class FindTiersByBankHandler
  implements IQueryHandler<FindTiersByBankQuery>
{
  constructor(
    @Inject(TIER_REPOSITORY)
    private readonly tierRepository: TierRepository,
  ) {}

  async execute(query: FindTiersByBankQuery): Promise<TierView[]> {
    return this.tierRepository
      .findByBank(bankCode(query.bankCode))
      .map(toTierView);
  }
}

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
