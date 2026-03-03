import type { Sector } from '../../product-catalog/domain/value-objects/sector';

export class CreateBankOfferDto {
  bankCode: string;
  displayName: string;
  description: string;
  sectors: { sector: Sector; tierIds: string[] }[];
  validFrom: string;
  validUntil: string;
  categories?: string[];
  metadata?: Record<string, string>;
}
