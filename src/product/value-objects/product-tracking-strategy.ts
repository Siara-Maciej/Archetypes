/**
 * ProductTrackingStrategy — how individual product instances are tracked.
 *
 * WHY: The fundamental question for any product is "How do we distinguish between
 *      individual items of this type?" A kilogram of rice is interchangeable
 *      (IDENTICAL), but a smartphone has a unique serial number (INDIVIDUALLY_TRACKED),
 *      while milk is tracked by production batch for recalls (BATCH_TRACKED).
 *
 * WHAT: Five strategies that cover the spectrum of product tracking needs:
 *
 *   UNIQUE                          — one-of-a-kind (Picasso painting, Hetfield's guitar)
 *   INDIVIDUALLY_TRACKED            — each has a serial number (iPhones, mortgage contracts)
 *   BATCH_TRACKED                   — tracked by production batch (milk, pharmaceuticals)
 *   INDIVIDUALLY_AND_BATCH_TRACKED  — both serial + batch (TVs, smartphones for recalls)
 *   IDENTICAL                       — fully interchangeable (screws, rice, flour)
 *
 * HOW: Enum with helper predicates. The tracking strategy is set when defining
 *      a ProductType and determines what identification is required when creating
 *      ProductInstances (serial numbers, batch IDs, or neither).
 */

export enum ProductTrackingStrategy {
  /** One-of-a-kind product. Example: Hetfield's guitar, da Vinci's painting. */
  UNIQUE = "UNIQUE",

  /** Each instance uniquely identified. Examples: iPhone, mortgage contract. */
  INDIVIDUALLY_TRACKED = "INDIVIDUALLY_TRACKED",

  /** Tracked by production batch for quality control. Examples: milk, pharmaceuticals. */
  BATCH_TRACKED = "BATCH_TRACKED",

  /** Both individual and batch tracking. Examples: TVs (serial + batch for recalls). */
  INDIVIDUALLY_AND_BATCH_TRACKED = "INDIVIDUALLY_AND_BATCH_TRACKED",

  /** Interchangeable items, may or may not create instances. Examples: screws, rice bags. */
  IDENTICAL = "IDENTICAL",
}

/** Returns true if each instance must have a unique individual identity (serial number). */
export function isTrackedIndividually(strategy: ProductTrackingStrategy): boolean {
  return (
    strategy === ProductTrackingStrategy.UNIQUE ||
    strategy === ProductTrackingStrategy.INDIVIDUALLY_TRACKED ||
    strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED
  );
}

/** Returns true if instances are tracked by production batch. */
export function isTrackedByBatch(strategy: ProductTrackingStrategy): boolean {
  return (
    strategy === ProductTrackingStrategy.BATCH_TRACKED ||
    strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED
  );
}

/** Returns true if both individual and batch tracking is required. */
export function requiresBothTrackingMethods(
  strategy: ProductTrackingStrategy,
): boolean {
  return strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
}

/** Returns true if instances are interchangeable (no unique identity needed). */
export function isInterchangeable(strategy: ProductTrackingStrategy): boolean {
  return strategy === ProductTrackingStrategy.IDENTICAL;
}
