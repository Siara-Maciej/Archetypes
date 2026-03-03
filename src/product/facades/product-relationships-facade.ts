/**
 * ProductRelationshipsFacade — application service for product relationships.
 *
 * WHY: Manages directed relationships between products (upgrades, substitutions,
 *      compatibility, etc.). Validates that both products exist before creating
 *      a relationship. Enforces policies.
 */

import { Result } from "../shared/result";
import {
  UuidProductIdentifier,
  ProductIdentifier,
} from "../value-objects/product-identifier";
import {
  ProductRelationship,
  ProductRelationshipId,
  ProductRelationshipType,
  ProductRelationshipDefiningPolicy,
  AlwaysAllowPolicy,
  createProductRelationship,
} from "../relationships/product-relationship";
import {
  ProductTypeRepository,
  ProductRelationshipRepository,
} from "../repositories/repositories";
import { DefineRelationship, RemoveRelationship } from "../cqrs/commands";

export class ProductRelationshipsFacade {
  private readonly policy: ProductRelationshipDefiningPolicy;

  constructor(
    private readonly repository: ProductRelationshipRepository,
    private readonly productTypeRepository: ProductTypeRepository,
    policy?: ProductRelationshipDefiningPolicy,
  ) {
    this.policy = policy ?? new AlwaysAllowPolicy();
  }

  /** Defines a new relationship between two products. */
  handleDefineRelationship(
    command: DefineRelationship,
  ): Result<string, ProductRelationshipId> {
    try {
      const from = UuidProductIdentifier.of(command.fromProductId);
      const to = UuidProductIdentifier.of(command.toProductId);
      const type = command.relationshipType.toUpperCase() as ProductRelationshipType;

      if (!this.productTypeRepository.findById(from)) {
        return Result.failure(`PRODUCT_NOT_FOUND: ${from.value}`);
      }
      if (!this.productTypeRepository.findById(to)) {
        return Result.failure(`PRODUCT_NOT_FOUND: ${to.value}`);
      }

      if (!this.policy.canDefineFor(from, to, type)) {
        return Result.failure("POLICIES_NOT_MET");
      }

      const relationship = createProductRelationship(
        ProductRelationshipId.random(),
        from,
        to,
        type,
      );
      this.repository.save(relationship);
      return Result.success(relationship.id);
    } catch (e) {
      return Result.failure(String((e as Error).message));
    }
  }

  /** Removes an existing relationship. */
  handleRemoveRelationship(
    command: RemoveRelationship,
  ): Result<string, ProductRelationshipId> {
    try {
      const id = ProductRelationshipId.of(command.relationshipId);
      this.repository.delete(id);
      return Result.success(id);
    } catch (e) {
      return Result.failure(String((e as Error).message));
    }
  }

  /** Finds all relationships from a given product. */
  findAllRelationsFrom(productId: ProductIdentifier): ProductRelationship[] {
    return this.repository.findAllRelationsFrom(productId);
  }
}
