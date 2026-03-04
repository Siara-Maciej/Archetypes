/**
 * CatalogEntry — abstract base for commercial offering positions.
 *
 * Product (ProductType) defines WHAT something IS from a business perspective.
 * CatalogEntry defines that it's FOR SALE — with marketing name, sales copy,
 * categories for navigation, validity period, and flexible metadata.
 *
 * The same ProductType can appear in MULTIPLE catalog entries — different
 * campaigns, markets, time periods.
 *
 * Banking domain: BankOffer extends CatalogEntry
 *   - wraps Tiers with marketing information and sector configuration
 *   - validity defines when the offer is available
 *   - categories organize offers for navigation
 */

import type { Validity } from './validity';

export abstract class CatalogEntry {
  abstract readonly id: { readonly value: string };
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly categories: readonly string[];
  abstract readonly metadata: Record<string, string>;

  /** When this catalog entry is available for purchase. */
  abstract readonly validity: Validity;

  /** Checks if available for purchase at the given ISO date. */
  isAvailableAt(date: string): boolean {
    return this.validity.isValidAt(date);
  }

  /** Checks if entry belongs to the given category. */
  isInCategory(category: string): boolean {
    return this.categories.includes(category);
  }
}
