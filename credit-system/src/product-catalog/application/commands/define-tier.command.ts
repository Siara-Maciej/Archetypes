import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { bankCode, Result } from '../../../shared/domain';
import { Rate } from '../../../shared/domain/rate';
import { Months } from '../../../shared/domain/months';
import { SalaryRange } from '../../domain/value-objects/salary-range';
import type { Sector } from '../../domain/value-objects/sector';
import { TierId } from '../../domain/value-objects/tier-id';
import { Tier } from '../../domain/model/tier';
import { TIER_REPOSITORY } from '../../domain/repository/tier.repository';
import type { TierRepository } from '../../domain/repository/tier.repository';

export class DefineTierCommand implements ICommand {
  constructor(
    public readonly bankCode: string,
    public readonly name: string,
    public readonly sector: Sector,
    public readonly salaryMin: number,
    public readonly salaryMax: number | null,
    public readonly interestRate: number,
    public readonly maxDeductionRate: number,
    public readonly maxLoanToValue: number,
    public readonly minTermMonths: number,
    public readonly maxTermMonths: number,
    public readonly minDownPaymentRate: number,
    public readonly processingFee: number,
    public readonly insuranceRequired: boolean,
    public readonly metadata: Record<string, string> = {},
  ) {}
}

@CommandHandler(DefineTierCommand)
export class DefineTierHandler implements ICommandHandler<DefineTierCommand> {
  constructor(
    @Inject(TIER_REPOSITORY)
    private readonly tierRepository: TierRepository,
  ) {}

  async execute(command: DefineTierCommand): Promise<Result<string, string>> {
    try {
      const tierId = TierId.generate();
      const tier = new Tier({
        id: tierId,
        bankCode: bankCode(command.bankCode),
        name: command.name,
        sector: command.sector,
        salaryRange: SalaryRange.of(command.salaryMin, command.salaryMax),
        interestRate: Rate.of(command.interestRate),
        maxDeductionRate: Rate.of(command.maxDeductionRate),
        maxLoanToValue: Rate.of(command.maxLoanToValue),
        minTerm: Months.of(command.minTermMonths),
        maxTerm: Months.of(command.maxTermMonths),
        minDownPaymentRate: Rate.of(command.minDownPaymentRate),
        processingFee: Rate.of(command.processingFee),
        insuranceRequired: command.insuranceRequired,
        metadata: command.metadata,
      });
      this.tierRepository.save(tier);
      return Result.success(tierId.value);
    } catch (e) {
      return Result.failure((e as Error).message);
    }
  }
}
