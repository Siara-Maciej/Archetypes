/**
 * Queries — read operations for the Product Archetype public API.
 *
 * WHY: Queries represent requests for information. Like commands, they use only
 *      primitive types to keep the API boundary clean. All filtering is done
 *      inside the facade, not by the caller.
 *
 * WHAT: Each query is a criteria object describing what to search for.
 */

export interface FindProductTypeCriteria {
  readonly productId: string;
}

export interface FindByTrackingStrategyCriteria {
  readonly trackingStrategy: string;
}

export interface SearchCatalogCriteria {
  readonly searchText?: string;
  readonly categories?: Set<string>;
  readonly availableAt?: string;
  readonly productTypeId?: string;
}

export interface FindCatalogEntryCriteria {
  readonly catalogEntryId: string;
}

export interface FindByCategoryCriteria {
  readonly category: string;
}

export interface FindAvailableAtCriteria {
  readonly date: string;
}

export interface FindByMetadataCriteria {
  readonly key: string;
  readonly value?: string;
}
