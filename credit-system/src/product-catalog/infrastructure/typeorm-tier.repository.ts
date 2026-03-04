import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BankCode, bankCode } from '../../shared/domain';
import { Rate } from '../../shared/domain/rate';
import { Months } from '../../shared/domain/months';
import { SalaryRange } from '../domain/value-objects/salary-range';
import { TierId } from '../domain/value-objects/tier-id';
import { Tier } from '../domain/model/tier';
import type { TierRepository } from '../domain/repository/tier.repository';
import { TierEntity } from './entities/tier.entity';
import type { Sector } from '../domain/value-objects/sector';

@Injectable()
export class TypeOrmTierRepository implements TierRepository {
  constructor(
    @InjectRepository(TierEntity)
    private readonly repo: Repository<TierEntity>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  save(tier: Tier): void {
    const entity = this.toEntity(tier);
    void this.repo.save(entity).then(() => {
      this.logger.log(`Tier saved: ${tier.id.value} (${tier.name})`, 'TierRepository');
    });
  }

  findById(id: TierId): Tier | undefined {
    // Synchronous interface — for production, consider making async
    // For now, we keep the domain interface sync and use the InMemory in tests
    return undefined;
  }

  findAll(): Tier[] {
    return [];
  }

  findByBank(bankCodeVal: BankCode): Tier[] {
    return [];
  }

  findByBankAndSector(bankCodeVal: BankCode, sector: Sector): Tier[] {
    return [];
  }

  findByIds(ids: TierId[]): Tier[] {
    return [];
  }

  remove(id: TierId): void {
    void this.repo.delete(id.value);
  }

  // ─── Async methods for production use ───────────────────

  async saveAsync(tier: Tier): Promise<void> {
    await this.repo.save(this.toEntity(tier));
    this.logger.log(`Tier saved: ${tier.id.value} (${tier.name})`, 'TierRepository');
  }

  async findByIdAsync(id: TierId): Promise<Tier | undefined> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findAllAsync(): Promise<Tier[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findByBankAsync(bankCodeVal: BankCode): Promise<Tier[]> {
    const entities = await this.repo.find({
      where: { bankCode: bankCodeVal as string },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByBankAndSectorAsync(
    bankCodeVal: BankCode,
    sector: Sector,
  ): Promise<Tier[]> {
    const entities = await this.repo.find({
      where: { bankCode: bankCodeVal as string, sector },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByIdsAsync(ids: TierId[]): Promise<Tier[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.find({
      where: { id: In(ids.map((i) => i.value)) },
    });
    return entities.map((e) => this.toDomain(e));
  }

  // ─── Mappers ────────────────────────────────────────────

  private toEntity(tier: Tier): TierEntity {
    const e = new TierEntity();
    e.id = tier.id.value;
    e.bankCode = tier.bankCode as string;
    e.name = tier.name;
    e.sector = tier.sector;
    e.salaryMin = tier.salaryRange.min;
    e.salaryMax = tier.salaryRange.max;
    e.interestRate = tier.interestRate.value;
    e.maxDeductionRate = tier.maxDeductionRate.value;
    e.maxLoanToValue = tier.maxLoanToValue.value;
    e.minTermMonths = tier.minTerm.value;
    e.maxTermMonths = tier.maxTerm.value;
    e.minDownPaymentRate = tier.minDownPaymentRate.value;
    e.processingFee = tier.processingFee.value;
    e.insuranceRequired = tier.insuranceRequired;
    e.metadata = { ...tier.metadata };
    return e;
  }

  private toDomain(e: TierEntity): Tier {
    return new Tier({
      id: TierId.of(e.id),
      bankCode: bankCode(e.bankCode),
      name: e.name,
      sector: e.sector as Sector,
      salaryRange: SalaryRange.of(Number(e.salaryMin), e.salaryMax != null ? Number(e.salaryMax) : null),
      interestRate: Rate.of(Number(e.interestRate)),
      maxDeductionRate: Rate.of(Number(e.maxDeductionRate)),
      maxLoanToValue: Rate.of(Number(e.maxLoanToValue)),
      minTerm: Months.of(e.minTermMonths),
      maxTerm: Months.of(e.maxTermMonths),
      minDownPaymentRate: Rate.of(Number(e.minDownPaymentRate)),
      processingFee: Rate.of(Number(e.processingFee)),
      insuranceRequired: e.insuranceRequired,
      metadata: e.metadata ?? {},
    });
  }
}
