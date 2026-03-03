/**
 * Views — read models (DTOs) returned by the Product Archetype public API.
 *
 * WHY: Domain objects (ProductType, CatalogEntry) should not be exposed directly
 *      through the API. Views are lightweight, immutable data transfer objects
 *      that contain only the information needed by API consumers. They use
 *      primitive types — no domain internals leak.
 *
 * WHAT: Each view mirrors a domain concept but as a plain data structure.
 */

export interface ProductTypeView {
  readonly productId: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
  readonly trackingStrategy: string;
  readonly mandatoryFeatures: FeatureTypeView[];
  readonly optionalFeatures: FeatureTypeView[];
}

export interface FeatureTypeView {
  readonly name: string;
  readonly valueType: string;
  readonly constraintType: string;
  readonly constraintConfig: Record<string, unknown>;
  readonly constraintDescription: string;
}

export interface CatalogEntryView {
  readonly catalogEntryId: string;
  readonly displayName: string;
  readonly description: string;
  readonly productTypeId: string;
  readonly categories: string[];
  readonly availableFrom: string | undefined;
  readonly availableUntil: string | undefined;
  readonly metadata: Record<string, string>;
}
