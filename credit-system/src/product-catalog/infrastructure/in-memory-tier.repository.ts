import { Injectable } from '@nestjs/common';
import { BankCode } from '../../shared/domain';
import { Sector } from '../domain/value-objects/sector';
import { TierId } from '../domain/value-objects/tier-id';
import { Tier } from '../domain/model/tier';
import { TierRepository } from '../domain/repository/tier.repository';

@Injectable()
export class InMemoryTierRepository implements TierRepository {
  private readonly storage = new Map<string, Tier>();

  save(tier: Tier): void {
    this.storage.set(tier.id.value, tier);
  }

  findById(id: TierId): Tier | undefined {
    return this.storage.get(id.value);
  }

  findAll(): Tier[] {
    return [...this.storage.values()];
  }

  findByBank(bankCode: BankCode): Tier[] {
    return [...this.storage.values()].filter((t) => t.bankCode === bankCode);
  }

  findByBankAndSector(bankCode: BankCode, sector: Sector): Tier[] {
    return [...this.storage.values()].filter(
      (t) => t.bankCode === bankCode && t.sector === sector,
    );
  }

  findByIds(ids: TierId[]): Tier[] {
    const idSet = new Set(ids.map((id) => id.value));
    return [...this.storage.values()].filter((t) => idSet.has(t.id.value));
  }

  remove(id: TierId): void {
    this.storage.delete(id.value);
  }
}
