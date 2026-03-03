/**
 * Product Archetype — a comprehensive domain model for products.
 *
 * This module implements the Product Archetype pattern, providing a universal,
 * industry-agnostic model for defining products, their features, packaging,
 * instances, catalog management, and inter-product relationships.
 *
 * Translated from the Java reference implementation:
 * https://github.com/Archetypy-Oprogramowania/archetypes
 *
 * Architecture:
 *   shared/        — cross-cutting utilities (preconditions, Result)
 *   value-objects/  — immutable value types (identifiers, names, validity)
 *   features/       — configurable product characteristics
 *   constraints/    — applicability constraints (specification pattern)
 *   selection/      — package selection rules
 *   domain/         — core entities (Product, ProductType, PackageType)
 *   instances/      — concrete product instances
 *   catalog/        — commercial offering management
 *   relationships/  — product-to-product relationships
 *   repositories/   — data access abstractions
 *   cqrs/           — commands, queries, views (public API DTOs)
 *   facades/        — application services (entry points)
 */

// Shared
export { IllegalArgumentError, checkArgument } from "./shared/preconditions";
export { Result } from "./shared/result";

// Value Objects
export * from "./value-objects";

// Features
export * from "./features";

// Constraints
export * from "./constraints";

// Selection Rules
export * from "./selection";

// Domain
export * from "./domain";

// Instances
export * from "./instances";

// Catalog
export * from "./catalog";

// Relationships
export * from "./relationships";

// Repositories
export * from "./repositories";

// CQRS
export * from "./cqrs";

// Facades
export * from "./facades";
