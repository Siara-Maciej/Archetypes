import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '../../../shared/domain';
import { CreditOfferId } from '../../../credit-quoting/domain/model/credit-offer-id';
import { CREDIT_OFFER_REPOSITORY } from '../../../credit-quoting/domain/repository/credit-offer.repository';
import type { CreditOfferRepository } from '../../../credit-quoting/domain/repository/credit-offer.repository';
import { CreditAgreement } from '../../domain/model/credit-agreement';
import { CreditAgreementId } from '../../domain/model/credit-agreement-id';
import { CREDIT_AGREEMENT_REPOSITORY } from '../../domain/repository/credit-agreement.repository';
import type { CreditAgreementRepository } from '../../domain/repository/credit-agreement.repository';

export class CreateAgreementCommand implements ICommand {
  constructor(public readonly creditOfferId: string) {}
}

let agreementCounter = 0;

function generateAgreementNumber(bankCode: string): string {
  agreementCounter++;
  const year = new Date().getFullYear();
  return `${bankCode}/${year}/${String(agreementCounter).padStart(6, '0')}`;
}

@CommandHandler(CreateAgreementCommand)
export class CreateAgreementHandler
  implements ICommandHandler<CreateAgreementCommand>
{
  constructor(
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
    @Inject(CREDIT_AGREEMENT_REPOSITORY)
    private readonly agreementRepo: CreditAgreementRepository,
  ) {}

  async execute(command: CreateAgreementCommand): Promise<Result<string, string>> {
    try {
      const offer = this.creditOfferRepo.findById(
        CreditOfferId.of(command.creditOfferId),
      );
      if (!offer) {
        return Result.failure(
          `CreditOffer not found: ${command.creditOfferId}`,
        );
      }
      if (offer.status !== 'ACCEPTED') {
        return Result.failure(
          `CreditOffer must be ACCEPTED to create agreement, current status: ${offer.status}`,
        );
      }

      const agreementId = CreditAgreementId.generate();
      const agreementNumber = generateAgreementNumber(
        offer.bankCode as string,
      );

      const agreement = new CreditAgreement({
        id: agreementId,
        agreementNumber,
        bankCode: offer.bankCode,
        creditOfferId: offer.id.value,
        tierId: offer.tierId,
        creditAmount: offer.creditAmount,
        monthlyPayment: offer.monthlyPayment,
        interestRate: offer.effectiveInterestRate,
        termMonths: offer.termMonths,
        status: 'ACTIVE',
        signedAt: new Date().toISOString(),
      });

      this.agreementRepo.save(agreement);
      return Result.success(agreementId.value);
    } catch (e) {
      return Result.failure((e as Error).message);
    }
  }
}
