/**
 * ProductConfiguration — wires up all components with in-memory repositories.
 *
 * WHY: The Product Archetype has many collaborating objects (facades, repositories,
 *      policies). This factory method creates a fully wired configuration ready
 *      for use in tests or as a starting point for production.
 *
 * WHAT: Creates in-memory versions of all repositories and wires them into
 *       facades. Returns a configuration object with access to all components.
 *
 * FOR PRODUCTION: Replace InMemory* repositories with database-backed ones.
 */

import {
  InMemoryProductTypeRepository,
  InMemoryCatalogEntryRepository,
  InMemoryProductRelationshipRepository,
  ProductTypeRepository,
} from "../repositories/repositories";
import { ProductFacade } from "./product-facade";
import { ProductCatalog } from "./product-catalog";
import { ProductRelationshipsFacade } from "./product-relationships-facade";

export class ProductConfiguration {
  readonly productFacade: ProductFacade;
  readonly productCatalog: ProductCatalog;
  readonly productRelationshipsFacade: ProductRelationshipsFacade;
  readonly productTypeRepository: ProductTypeRepository;

  private constructor(
    productFacade: ProductFacade,
    productCatalog: ProductCatalog,
    productRelationshipsFacade: ProductRelationshipsFacade,
    productTypeRepository: ProductTypeRepository,
  ) {
    this.productFacade = productFacade;
    this.productCatalog = productCatalog;
    this.productRelationshipsFacade = productRelationshipsFacade;
    this.productTypeRepository = productTypeRepository;
  }

  /** Creates a fully wired in-memory configuration — ready for tests. */
  static inMemory(): ProductConfiguration {
    const productTypeRepo = new InMemoryProductTypeRepository();
    const catalogRepo = new InMemoryCatalogEntryRepository();
    const relationshipRepo = new InMemoryProductRelationshipRepository();

    const productFacade = new ProductFacade(productTypeRepo);
    const productCatalog = new ProductCatalog(catalogRepo, productTypeRepo);
    const relationshipsFacade = new ProductRelationshipsFacade(
      relationshipRepo,
      productTypeRepo,
    );

    return new ProductConfiguration(
      productFacade,
      productCatalog,
      relationshipsFacade,
      productTypeRepo,
    );
  }
}
