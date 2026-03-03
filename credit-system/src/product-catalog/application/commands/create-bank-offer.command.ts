import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { bankCode, Result } from '../../../shared/domain';
import type { Sector } from '../../domain/value-objects/sector';
import { BankOfferId } from '../../domain/value-objects/bank-offer-id';
import { TierId } from '../../domain/value-objects/tier-id';
import { BankOffer } from '../../domain/model/bank-offer';
import type { SectorConfig } from '../../domain/model/bank-offer';
import { BANK_OFFER_REPOSITORY } from '../../domain/repository/bank-offer.repository';
import type { BankOfferRepository } from '../../domain/repository/bank-offer.repository';

export interface SectorInput {
  sector: Sector;
  tierIds: string[];
}

export class CreateBankOfferCommand implements ICommand {
  constructor(
    public readonly bankCode: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly sectors: SectorInput[],
    public readonly validFrom: string,
    public readonly validUntil: string,
    public readonly categories: string[] = [],
    public readonly metadata: Record<string, string> = {},
  ) {}
}

@CommandHandler(CreateBankOfferCommand)
export class CreateBankOfferHandler
  implements ICommandHandler<CreateBankOfferCommand>
{
  constructor(
    @Inject(BANK_OFFER_REPOSITORY)
    private readonly bankOfferRepository: BankOfferRepository,
  ) {}

  async execute(command: CreateBankOfferCommand): Promise<Result<string, string>> {
    try {
      const offerId = BankOfferId.generate();
      const sectors: SectorConfig[] = command.sectors.map((s) => ({
        sector: s.sector,
        tierIds: s.tierIds.map((id) => TierId.of(id)),
      }));

      const offer = new BankOffer({
        id: offerId,
        bankCode: bankCode(command.bankCode),
        displayName: command.displayName,
        description: command.description,
        sectors,
        validFrom: command.validFrom,
        validUntil: command.validUntil,
        categories: command.categories,
        metadata: command.metadata,
      });

      this.bankOfferRepository.save(offer);
      return Result.success(offerId.value);
    } catch (e) {
      return Result.failure((e as Error).message);
    }
  }
}
