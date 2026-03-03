import { BankCode } from '../../../shared/domain';
import { BankOfferId } from '../value-objects/bank-offer-id';
import { TierId } from '../value-objects/tier-id';
import { Sector } from '../value-objects/sector';

export interface SectorConfig {
  sector: Sector;
  tierIds: TierId[];
}

export interface BankOfferProps {
  id: BankOfferId;
  bankCode: BankCode;
  displayName: string;
  description: string;
  sectors: SectorConfig[];
  validFrom: string;
  validUntil: string;
  categories: string[];
  metadata: Record<string, string>;
}

/**
 * BankOffer = CatalogEntry in the Product Archetype.
 *
 * A commercial offering from a bank — wraps tiers with marketing
 * information, validity period, and sector configuration.
 */
export class BankOffer {
  readonly id: BankOfferId;
  readonly bankCode: BankCode;
  readonly displayName: string;
  readonly description: string;
  readonly sectors: readonly SectorConfig[];
  readonly validFrom: string;
  readonly validUntil: string;
  readonly categories: readonly string[];
  readonly metadata: Record<string, string>;

  constructor(props: BankOfferProps) {
    if (!props.displayName || props.displayName.trim().length === 0) {
      throw new Error('BankOffer displayName cannot be empty');
    }
    this.id = props.id;
    this.bankCode = props.bankCode;
    this.displayName = props.displayName;
    this.description = props.description;
    this.sectors = [...props.sectors];
    this.validFrom = props.validFrom;
    this.validUntil = props.validUntil;
    this.categories = [...props.categories];
    this.metadata = { ...props.metadata };
  }

  isAvailableAt(date: string): boolean {
    return date >= this.validFrom && date <= this.validUntil;
  }

  getTierIdsForSector(sector: Sector): TierId[] {
    const config = this.sectors.find((s) => s.sector === sector);
    return config ? [...config.tierIds] : [];
  }

  getAllTierIds(): TierId[] {
    return this.sectors.flatMap((s) => [...s.tierIds]);
  }

  isInCategory(category: string): boolean {
    return this.categories.includes(category);
  }

  withMetadata(metadata: Record<string, string>): BankOffer {
    return new BankOffer({ ...this.toProps(), metadata });
  }

  private toProps(): BankOfferProps {
    return {
      id: this.id,
      bankCode: this.bankCode,
      displayName: this.displayName,
      description: this.description,
      sectors: [...this.sectors],
      validFrom: this.validFrom,
      validUntil: this.validUntil,
      categories: [...this.categories],
      metadata: { ...this.metadata },
    };
  }
}
