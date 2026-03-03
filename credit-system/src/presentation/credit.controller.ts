import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DefineTierCommand } from '../product-catalog/application/commands/define-tier.command';
import { CreateBankOfferCommand } from '../product-catalog/application/commands/create-bank-offer.command';
import {
  FindTierByIdQuery,
  FindTiersByBankQuery,
} from '../product-catalog/application/queries/find-tier.query';
import {
  FindBankOfferByIdQuery,
  FindBankOffersByBankQuery,
} from '../product-catalog/application/queries/find-bank-offer.query';
import { CalculateCreditOfferCommand } from '../credit-quoting/application/commands/calculate-credit-offer.command';
import { AcceptCreditOfferCommand } from '../credit-quoting/application/commands/accept-credit-offer.command';
import { RejectCreditOfferCommand } from '../credit-quoting/application/commands/reject-credit-offer.command';
import {
  GetCreditOfferQuery,
  ListActiveCreditOffersQuery,
} from '../credit-quoting/application/queries/get-credit-offer.query';
import { CreateAgreementCommand } from '../credit-agreement/application/commands/create-agreement.command';
import { Result } from '../shared/domain';
import { DefineTierDto } from './dto/define-tier.dto';
import { CreateBankOfferDto } from './dto/create-bank-offer.dto';
import { CalculateCreditDto } from './dto/calculate-credit.dto';

@Controller('api')
export class CreditController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ─── Tier endpoints ────────────────────────────────────────

  @Post('tiers')
  @HttpCode(HttpStatus.CREATED)
  async defineTier(@Body() dto: DefineTierDto) {
    const result: Result<string, string> = await this.commandBus.execute(
      new DefineTierCommand(
        dto.bankCode,
        dto.name,
        dto.sector,
        dto.salaryMin,
        dto.salaryMax,
        dto.interestRate,
        dto.maxDeductionRate,
        dto.maxLoanToValue,
        dto.minTermMonths,
        dto.maxTermMonths,
        dto.minDownPaymentRate,
        dto.processingFee,
        dto.insuranceRequired,
        dto.metadata,
      ),
    );
    if (result.isFailure()) throw new BadRequestException(result.getError());
    return { tierId: result.getValue() };
  }

  @Get('tiers/:id')
  async getTier(@Param('id') id: string) {
    const result = await this.queryBus.execute(new FindTierByIdQuery(id));
    if (!result) throw new NotFoundException(`Tier not found: ${id}`);
    return result;
  }

  @Get('banks/:bankCode/tiers')
  async getTiersByBank(@Param('bankCode') bankCode: string) {
    return this.queryBus.execute(new FindTiersByBankQuery(bankCode));
  }

  // ─── BankOffer endpoints ───────────────────────────────────

  @Post('bank-offers')
  @HttpCode(HttpStatus.CREATED)
  async createBankOffer(@Body() dto: CreateBankOfferDto) {
    const result: Result<string, string> = await this.commandBus.execute(
      new CreateBankOfferCommand(
        dto.bankCode,
        dto.displayName,
        dto.description,
        dto.sectors,
        dto.validFrom,
        dto.validUntil,
        dto.categories,
        dto.metadata,
      ),
    );
    if (result.isFailure()) throw new BadRequestException(result.getError());
    return { bankOfferId: result.getValue() };
  }

  @Get('bank-offers/:id')
  async getBankOffer(@Param('id') id: string) {
    const result = await this.queryBus.execute(
      new FindBankOfferByIdQuery(id),
    );
    if (!result) throw new NotFoundException(`BankOffer not found: ${id}`);
    return result;
  }

  @Get('banks/:bankCode/offers')
  async getBankOffersByBank(@Param('bankCode') bankCode: string) {
    return this.queryBus.execute(new FindBankOffersByBankQuery(bankCode));
  }

  // ─── CreditOffer endpoints ────────────────────────────────

  @Post('credit-offers/calculate')
  @HttpCode(HttpStatus.CREATED)
  async calculateCreditOffer(@Body() dto: CalculateCreditDto) {
    const result: Result<string, string> = await this.commandBus.execute(
      new CalculateCreditOfferCommand(
        dto.bankOfferId,
        dto.customer.sector,
        dto.customer.employmentType,
        dto.customer.netMonthlySalary,
        dto.customer.monthlyObligations,
        dto.customer.employmentMonths,
        dto.vehicle.price,
        dto.vehicle.isNew,
        dto.vehicle.year,
        dto.requestedTermMonths,
        dto.downPayment,
        dto.currency,
      ),
    );
    if (result.isFailure()) throw new BadRequestException(result.getError());
    return { creditOfferId: result.getValue() };
  }

  @Get('credit-offers/:id')
  async getCreditOffer(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetCreditOfferQuery(id));
    if (!result) throw new NotFoundException(`CreditOffer not found: ${id}`);
    return result;
  }

  @Get('credit-offers')
  async listActiveCreditOffers() {
    return this.queryBus.execute(new ListActiveCreditOffersQuery());
  }

  @Post('credit-offers/:id/accept')
  async acceptCreditOffer(@Param('id') id: string) {
    const result: Result<string, string> = await this.commandBus.execute(
      new AcceptCreditOfferCommand(id),
    );
    if (result.isFailure()) throw new BadRequestException(result.getError());
    return { creditOfferId: result.getValue(), status: 'ACCEPTED' };
  }

  @Post('credit-offers/:id/reject')
  async rejectCreditOffer(@Param('id') id: string) {
    const result: Result<string, string> = await this.commandBus.execute(
      new RejectCreditOfferCommand(id),
    );
    if (result.isFailure()) throw new BadRequestException(result.getError());
    return { creditOfferId: result.getValue(), status: 'REJECTED' };
  }

  // ─── CreditAgreement endpoints ────────────────────────────

  @Post('credit-offers/:id/agreement')
  @HttpCode(HttpStatus.CREATED)
  async createAgreement(@Param('id') creditOfferId: string) {
    const result: Result<string, string> = await this.commandBus.execute(
      new CreateAgreementCommand(creditOfferId),
    );
    if (result.isFailure()) throw new BadRequestException(result.getError());
    return { creditAgreementId: result.getValue() };
  }
}
