/**
 * ProductDescription — the human-readable description of a product type.
 *
 * WHY: Same rationale as ProductName — prevents empty/blank descriptions
 *      from polluting the domain. Enforces that every product carries
 *      a meaningful description.
 *
 * WHAT: An immutable wrapper around a non-blank string.
 *
 * This is a VALUE OBJECT — compared by its inner value, not by reference.
 */

import { checkArgument } from "../shared/preconditions";

export class ProductDescription {
  readonly value: string;

  constructor(value: string) {
    checkArgument(
      value != null && value.trim().length > 0,
      "Product description must not be blank",
    );
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
