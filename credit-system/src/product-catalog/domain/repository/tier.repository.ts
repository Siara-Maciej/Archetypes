import { BankCode } from '../../../shared/domain';
import { Sector } from '../value-objects/sector';
import { TierId } from '../value-objects/tier-id';
import { Tier } from '../model/tier';

export const TIER_REPOSITORY = Symbol('TierRepository');

export interface TierRepository {
  save(tier: Tier): void;
  findById(id: TierId): Tier | undefined;
  findAll(): Tier[];
  findByBank(bankCode: BankCode): Tier[];
  findByBankAndSector(bankCode: BankCode, sector: Sector): Tier[];
  findByIds(ids: TierId[]): Tier[];
  remove(id: TierId): void;
}
