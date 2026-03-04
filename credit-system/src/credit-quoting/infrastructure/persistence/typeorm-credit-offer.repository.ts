import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BankCode, bankCode } from '../../../shared/domain';
import { Money } from '../../../shared/domain/money';
import { Rate } from '../../../shared/domain/rate';
import { CreditOfferId } from '../../domain/model/credit-offer-id';
import { CreditOffer } from '../../domain/model/credit-offer';
import type { CreditOfferStatus } from '../../domain/model/credit-offer';
import type { CreditOfferRepository } from '../../domain/repository/credit-offer.repository';
import { CreditOfferEntity } from '../entities/credit-offer.entity';

@Injectable()
export class TypeOrmCreditOfferRepository implements CreditOfferRepository {
  constructor(
    @InjectRepository(CreditOfferEntity)
    private readonly repo: Repository<CreditOfferEntity>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  save(offer: CreditOffer): void {
    void this.repo.save(this.toEntity(offer)).then(() => {
      this.logger.log(
        `CreditOffer saved: ${offer.id.value} status=${offer.status}`,
        'CreditOfferRepository',
      );
    });
  }

  findById(id: CreditOfferId): CreditOffer | undefined {
    return undefined;
  }

  findAll(): CreditOffer[] {
    return [];
  }

  findByBank(bankCodeVal: BankCode): CreditOffer[] {
    return [];
  }

  findActive(): CreditOffer[] {
    return [];
  }

  remove(id: CreditOfferId): void {
    void this.repo.delete(id.value);
  }

  // ─── Async methods ─────────────────────────────────────

  async saveAsync(offer: CreditOffer): Promise<void> {
    await this.repo.save(this.toEntity(offer));
    this.logger.log(
      `CreditOffer saved: ${offer.id.value} status=${offer.status}`,
      'CreditOfferRepository',
    );
  }

  async findByIdAsync(id: CreditOfferId): Promise<CreditOffer | undefined> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findAllAsync(): Promise<CreditOffer[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findActiveAsync(): Promise<CreditOffer[]> {
    const entities = await this.repo.find({
      where: [{ status: 'DRAFT' }, { status: 'PRESENTED' }],
    });
    return entities.map((e) => this.toDomain(e));
  }

  // ─── Mappers ────────────────────────────────────────────

  private toEntity(offer: CreditOffer): CreditOfferEntity {
    const e = new CreditOfferEntity();
    e.id = offer.id.value;
    e.bankCode = offer.bankCode as string;
    e.tierId = offer.tierId;
    e.bankOfferId = offer.bankOfferId;
    e.creditAmount = offer.creditAmount.amount;
    e.creditCurrency = offer.creditAmount.currency;
    e.monthlyPayment = offer.monthlyPayment.amount;
    e.totalRepayment = offer.totalRepayment.amount;
    e.totalInterest = offer.totalInterest.amount;
    e.effectiveInterestRate = offer.effectiveInterestRate.value;
    e.termMonths = offer.termMonths;
    e.extras = {};
    for (const [key, money] of Object.entries(offer.extras)) {
      e.extras[key] = { amount: money.amount, currency: money.currency };
    }
    e.status = offer.status;
    e.createdAt = offer.createdAt;
    e.expiresAt = offer.expiresAt;
    return e;
  }

  private toDomain(e: CreditOfferEntity): CreditOffer {
    const extras: Record<string, Money> = {};
    if (e.extras) {
      for (const [key, val] of Object.entries(e.extras)) {
        extras[key] = Money.of(val.amount, val.currency);
      }
    }
    return new CreditOffer({
      id: CreditOfferId.of(e.id),
      bankCode: bankCode(e.bankCode),
      tierId: e.tierId,
      bankOfferId: e.bankOfferId,
      creditAmount: Money.of(Number(e.creditAmount), e.creditCurrency),
      monthlyPayment: Money.of(Number(e.monthlyPayment), e.creditCurrency),
      totalRepayment: Money.of(Number(e.totalRepayment), e.creditCurrency),
      totalInterest: Money.of(Number(e.totalInterest), e.creditCurrency),
      effectiveInterestRate: Rate.of(Number(e.effectiveInterestRate)),
      termMonths: e.termMonths,
      extras,
      status: e.status as CreditOfferStatus,
      createdAt: e.createdAt,
      expiresAt: e.expiresAt,
    });
  }
}
