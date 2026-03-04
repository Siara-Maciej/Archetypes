import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BankCode, bankCode } from '../../shared/domain';
import { BankOfferId } from '../domain/value-objects/bank-offer-id';
import { TierId } from '../domain/value-objects/tier-id';
import { BankOffer } from '../domain/model/bank-offer';
import type { BankOfferRepository } from '../domain/repository/bank-offer.repository';
import { BankOfferEntity } from './entities/bank-offer.entity';
import type { Sector } from '../domain/value-objects/sector';

@Injectable()
export class TypeOrmBankOfferRepository implements BankOfferRepository {
  constructor(
    @InjectRepository(BankOfferEntity)
    private readonly repo: Repository<BankOfferEntity>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  save(offer: BankOffer): void {
    void this.repo.save(this.toEntity(offer)).then(() => {
      this.logger.log(
        `BankOffer saved: ${offer.id.value} (${offer.displayName})`,
        'BankOfferRepository',
      );
    });
  }

  findById(id: BankOfferId): BankOffer | undefined {
    return undefined;
  }

  findAll(): BankOffer[] {
    return [];
  }

  findByBank(bankCodeVal: BankCode): BankOffer[] {
    return [];
  }

  findByCategory(category: string): BankOffer[] {
    return [];
  }

  findAvailableAt(date: string): BankOffer[] {
    return [];
  }

  remove(id: BankOfferId): void {
    void this.repo.delete(id.value);
  }

  // ─── Async methods ─────────────────────────────────────

  async saveAsync(offer: BankOffer): Promise<void> {
    await this.repo.save(this.toEntity(offer));
    this.logger.log(
      `BankOffer saved: ${offer.id.value} (${offer.displayName})`,
      'BankOfferRepository',
    );
  }

  async findByIdAsync(id: BankOfferId): Promise<BankOffer | undefined> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findAllAsync(): Promise<BankOffer[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findByBankAsync(bankCodeVal: BankCode): Promise<BankOffer[]> {
    const entities = await this.repo.find({
      where: { bankCode: bankCodeVal as string },
    });
    return entities.map((e) => this.toDomain(e));
  }

  // ─── Mappers ────────────────────────────────────────────

  private toEntity(offer: BankOffer): BankOfferEntity {
    const e = new BankOfferEntity();
    e.id = offer.id.value;
    e.bankCode = offer.bankCode as string;
    e.displayName = offer.displayName;
    e.description = offer.description;
    e.sectors = offer.sectors.map((s) => ({
      sector: s.sector,
      tierIds: s.tierIds.map((t) => t.value),
    }));
    e.validFrom = offer.validFrom;
    e.validUntil = offer.validUntil;
    e.categories = [...offer.categories];
    e.metadata = { ...offer.metadata };
    return e;
  }

  private toDomain(e: BankOfferEntity): BankOffer {
    return new BankOffer({
      id: BankOfferId.of(e.id),
      bankCode: bankCode(e.bankCode),
      displayName: e.displayName,
      description: e.description,
      sectors: (e.sectors ?? []).map((s) => ({
        sector: s.sector as Sector,
        tierIds: s.tierIds.map((id) => TierId.of(id)),
      })),
      validFrom: e.validFrom,
      validUntil: e.validUntil,
      categories: e.categories ?? [],
      metadata: e.metadata ?? {},
    });
  }
}
