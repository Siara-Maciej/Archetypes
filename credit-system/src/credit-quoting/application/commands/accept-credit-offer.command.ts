import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '../../../shared/domain';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CREDIT_OFFER_REPOSITORY } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';

export class AcceptCreditOfferCommand implements ICommand {
  constructor(public readonly creditOfferId: string) {}
}

@CommandHandler(AcceptCreditOfferCommand)
export class AcceptCreditOfferHandler
  implements ICommandHandler<AcceptCreditOfferCommand>
{
  constructor(
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
  ) {}

  async execute(command: AcceptCreditOfferCommand): Promise<Result<string, string>> {
    try {
      const offer = this.creditOfferRepo.findById(
        CreditOfferId.of(command.creditOfferId),
      );
      if (!offer) {
        return Result.failure(
          `CreditOffer not found: ${command.creditOfferId}`,
        );
      }

      offer.present(); // DRAFT → PRESENTED
      offer.accept(); // PRESENTED → ACCEPTED
      this.creditOfferRepo.save(offer);
      return Result.success(offer.id.value);
    } catch (e) {
      return Result.failure((e as Error).message);
    }
  }
}
