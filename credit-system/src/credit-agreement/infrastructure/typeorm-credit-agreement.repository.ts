import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BankCode, bankCode } from '../../shared/domain';
import { Money } from '../../shared/domain/money';
import { Rate } from '../../shared/domain/rate';
import { CreditAgreementId } from '../domain/model/credit-agreement-id';
import { CreditAgreement } from '../domain/model/credit-agreement';
import type { CreditAgreementStatus } from '../domain/model/credit-agreement';
import type { CreditAgreementRepository } from '../domain/repository/credit-agreement.repository';
import { CreditAgreementEntity } from './entities/credit-agreement.entity';

@Injectable()
export class TypeOrmCreditAgreementRepository
  implements CreditAgreementRepository
{
  constructor(
    @InjectRepository(CreditAgreementEntity)
    private readonly repo: Repository<CreditAgreementEntity>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  save(agreement: CreditAgreement): void {
    void this.repo.save(this.toEntity(agreement)).then(() => {
      this.logger.log(
        `CreditAgreement saved: ${agreement.id.value} (${agreement.agreementNumber})`,
        'CreditAgreementRepository',
      );
    });
  }

  findById(id: CreditAgreementId): CreditAgreement | undefined {
    return undefined;
  }

  findByAgreementNumber(number: string): CreditAgreement | undefined {
    return undefined;
  }

  findByBank(bankCodeVal: BankCode): CreditAgreement[] {
    return [];
  }

  findAll(): CreditAgreement[] {
    return [];
  }

  remove(id: CreditAgreementId): void {
    void this.repo.delete(id.value);
  }

  // ─── Async methods ─────────────────────────────────────

  async saveAsync(agreement: CreditAgreement): Promise<void> {
    await this.repo.save(this.toEntity(agreement));
    this.logger.log(
      `CreditAgreement saved: ${agreement.id.value} (${agreement.agreementNumber})`,
      'CreditAgreementRepository',
    );
  }

  async findByIdAsync(
    id: CreditAgreementId,
  ): Promise<CreditAgreement | undefined> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findByAgreementNumberAsync(
    number: string,
  ): Promise<CreditAgreement | undefined> {
    const entity = await this.repo.findOne({
      where: { agreementNumber: number },
    });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findAllAsync(): Promise<CreditAgreement[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  // ─── Mappers ────────────────────────────────────────────

  private toEntity(a: CreditAgreement): CreditAgreementEntity {
    const e = new CreditAgreementEntity();
    e.id = a.id.value;
    e.agreementNumber = a.agreementNumber;
    e.bankCode = a.bankCode as string;
    e.creditOfferId = a.creditOfferId;
    e.tierId = a.tierId;
    e.creditAmount = a.creditAmount.amount;
    e.creditCurrency = a.creditAmount.currency;
    e.monthlyPayment = a.monthlyPayment.amount;
    e.interestRate = a.interestRate.value;
    e.termMonths = a.termMonths;
    e.status = a.status;
    e.signedAt = a.signedAt;
    return e;
  }

  private toDomain(e: CreditAgreementEntity): CreditAgreement {
    return new CreditAgreement({
      id: CreditAgreementId.of(e.id),
      agreementNumber: e.agreementNumber,
      bankCode: bankCode(e.bankCode),
      creditOfferId: e.creditOfferId,
      tierId: e.tierId,
      creditAmount: Money.of(Number(e.creditAmount), e.creditCurrency),
      monthlyPayment: Money.of(Number(e.monthlyPayment), e.creditCurrency),
      interestRate: Rate.of(Number(e.interestRate)),
      termMonths: e.termMonths,
      status: e.status as CreditAgreementStatus,
      signedAt: e.signedAt,
    });
  }
}
