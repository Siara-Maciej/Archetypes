import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '../../../shared/domain';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CREDIT_OFFER_REPOSITORY } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';

export class RejectCreditOfferCommand implements ICommand {
  constructor(public readonly creditOfferId: string) {}
}

@CommandHandler(RejectCreditOfferCommand)
export class RejectCreditOfferHandler
  implements ICommandHandler<RejectCreditOfferCommand>
{
  constructor(
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
  ) {}

  async execute(command: RejectCreditOfferCommand): Promise<Result<string, string>> {
    try {
      const offer = this.creditOfferRepo.findById(
        CreditOfferId.of(command.creditOfferId),
      );
      if (!offer) {
        return Result.failure(
          `CreditOffer not found: ${command.creditOfferId}`,
        );
      }

      if (offer.status === 'DRAFT') {
        offer.present();
      }
      offer.reject();
      this.creditOfferRepo.save(offer);
      return Result.success(offer.id.value);
    } catch (e) {
      return Result.failure((e as Error).message);
    }
  }
}
