import { CatalogEntry } from '../../../shared/domain/archetype/catalog-entry';
import { Validity } from '../../../shared/domain/archetype/validity';
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
 * Extends the abstract CatalogEntry to provide a commercial offering
 * from a bank — wrapping Tiers (ProductTypes) with marketing information,
 * validity period, and sector configuration.
 *
 * Archetype mapping:
 *   - id, displayName, description, categories, metadata, validity
 *     come from CatalogEntry (the abstract archetype)
 *   - bankCode, sectors, getTierIdsForSector()
 *     are banking-domain-specific attributes
 */
export class BankOffer extends CatalogEntry {
  readonly id: BankOfferId;
  readonly bankCode: BankCode;
  readonly displayName: string;
  readonly description: string;
  readonly sectors: readonly SectorConfig[];
  readonly validity: Validity;
  readonly categories: readonly string[];
  readonly metadata: Record<string, string>;

  constructor(props: BankOfferProps) {
    super();
    if (!props.displayName || props.displayName.trim().length === 0) {
      throw new Error('BankOffer displayName cannot be empty');
    }
    this.id = props.id;
    this.bankCode = props.bankCode;
    this.displayName = props.displayName;
    this.description = props.description;
    this.sectors = [...props.sectors];
    this.validity = Validity.between(props.validFrom, props.validUntil);
    this.categories = [...props.categories];
    this.metadata = { ...props.metadata };
  }

  /** @deprecated Use isAvailableAt() inherited from CatalogEntry */
  get validFrom(): string {
    return this.validity.from!;
  }

  /** @deprecated Use isAvailableAt() inherited from CatalogEntry */
  get validUntil(): string {
    return this.validity.to!;
  }

  getTierIdsForSector(sector: Sector): TierId[] {
    const config = this.sectors.find((s) => s.sector === sector);
    return config ? [...config.tierIds] : [];
  }

  getAllTierIds(): TierId[] {
    return this.sectors.flatMap((s) => [...s.tierIds]);
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
      validFrom: this.validity.from!,
      validUntil: this.validity.to!,
      categories: [...this.categories],
      metadata: { ...this.metadata },
    };
  }
}
