import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { bankCode, Result } from '../../../shared/domain';
import { Money } from '../../../shared/domain/money';
import { BankOfferId } from '../../../product-catalog/domain/value-objects/bank-offer-id';
import { TIER_REPOSITORY } from '../../../product-catalog/domain/repository/tier.repository';
import type { TierRepository } from '../../../product-catalog/domain/repository/tier.repository';
import { BANK_OFFER_REPOSITORY } from '../../../product-catalog/domain/repository/bank-offer.repository';
import type { BankOfferRepository } from '../../../product-catalog/domain/repository/bank-offer.repository';
import { CreditOffer } from '../../domain/model/credit-offer';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CREDIT_OFFER_REPOSITORY } from '../../domain/repository/credit-offer.repository';
import type { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';
import { BANK_STRATEGY_REGISTRY } from '../../domain/services/bank-strategy-registry';
import type { BankStrategyRegistry } from '../../domain/services/bank-strategy-registry';
import type { CreditRequest } from '../../domain/services/credit-request';
import type { Sector } from '../../../product-catalog/domain/value-objects/sector';
import type { EmploymentType } from '../../../product-catalog/domain/value-objects/employment-type';

export class CalculateCreditOfferCommand implements ICommand {
  constructor(
    public readonly bankOfferId: string,
    public readonly customerSector: Sector,
    public readonly customerEmploymentType: EmploymentType,
    public readonly customerNetMonthlySalary: number,
    public readonly customerMonthlyObligations: number,
    public readonly customerEmploymentMonths: number,
    public readonly vehiclePrice: number,
    public readonly vehicleIsNew: boolean,
    public readonly vehicleYear: number,
    public readonly requestedTermMonths: number,
    public readonly downPayment: number,
    public readonly currency: string = 'PLN',
  ) {}
}

@CommandHandler(CalculateCreditOfferCommand)
export class CalculateCreditOfferHandler
  implements ICommandHandler<CalculateCreditOfferCommand>
{
  constructor(
    @Inject(BANK_OFFER_REPOSITORY)
    private readonly bankOfferRepo: BankOfferRepository,
    @Inject(TIER_REPOSITORY)
    private readonly tierRepo: TierRepository,
    @Inject(CREDIT_OFFER_REPOSITORY)
    private readonly creditOfferRepo: CreditOfferRepository,
    @Inject(BANK_STRATEGY_REGISTRY)
    private readonly registry: BankStrategyRegistry,
  ) {}

  async execute(command: CalculateCreditOfferCommand): Promise<Result<string, string>> {
    try {
      // 1. Find bank offer
      const bankOffer = this.bankOfferRepo.findById(
        BankOfferId.of(command.bankOfferId),
      );
      if (!bankOffer) {
        return Result.failure(`BankOffer not found: ${command.bankOfferId}`);
      }

      // 2. Extract bankCode → resolve bank-specific pipelines
      const bank = bankOffer.bankCode;
      if (!this.registry.isSupported(bank)) {
        return Result.failure(
          `No strategy configured for bank: ${bank as string}`,
        );
      }
      const { tierMatcher, calculator } = this.registry.resolve(bank);

      // 3. Get tiers for this offer and sector
      const tierIds = bankOffer.getTierIdsForSector(command.customerSector);
      if (tierIds.length === 0) {
        return Result.failure(
          `No tiers for sector ${command.customerSector} in offer ${command.bankOfferId}`,
        );
      }
      const tiers = this.tierRepo.findByIds(tierIds);
      if (tiers.length === 0) {
        return Result.failure('No tiers found in repository');
      }

      // 4. Build CreditRequest
      const creditRequest: CreditRequest = {
        customer: {
          sector: command.customerSector,
          employmentType: command.customerEmploymentType,
          netMonthlySalary: command.customerNetMonthlySalary,
          monthlyObligations: command.customerMonthlyObligations,
          employmentMonths: command.customerEmploymentMonths,
        },
        vehicle: {
          price: Money.of(command.vehiclePrice, command.currency),
          isNew: command.vehicleIsNew,
          year: command.vehicleYear,
        },
        requestedTermMonths: command.requestedTermMonths,
        downPayment: Money.of(command.downPayment, command.currency),
        bankOfferId: command.bankOfferId,
      };

      // 5. Match tier via bank-specific pipeline
      const matchResult = tierMatcher.execute(creditRequest, tiers);
      if (matchResult.kind === 'no_match') {
        return Result.failure(`No matching tier: ${matchResult.reason}`);
      }
      const matchedTier = matchResult.tier;

      // 6. Calculate via bank-specific pipeline
      const calcResult = calculator.execute(matchedTier, creditRequest);

      // 7. Create CreditOffer entity
      const offerId = CreditOfferId.generate();
      const now = new Date().toISOString();
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 30 days

      const creditOffer = new CreditOffer({
        id: offerId,
        bankCode: bank,
        tierId: matchedTier.id.value,
        bankOfferId: command.bankOfferId,
        creditAmount: calcResult.loanAmount,
        monthlyPayment: calcResult.monthlyPayment,
        totalRepayment: calcResult.totalRepayment,
        totalInterest: calcResult.totalInterest,
        effectiveInterestRate: calcResult.effectiveInterestRate,
        termMonths: command.requestedTermMonths,
        extras: calcResult.extras,
        status: 'DRAFT',
        createdAt: now,
        expiresAt,
      });

      this.creditOfferRepo.save(creditOffer);
      return Result.success(offerId.value);
    } catch (e) {
      return Result.failure((e as Error).message);
    }
  }
}
