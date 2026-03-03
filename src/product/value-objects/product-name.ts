/**
 * ProductName — the human-readable name of a product type.
 *
 * WHY: A raw `string` for product names would allow blank strings, making it
 *      trivially easy to create products with no name. A dedicated value object
 *      enforces the invariant "every product has a meaningful name" at the type
 *      system level — you simply cannot construct a blank ProductName.
 *
 * WHAT: An immutable wrapper around a non-blank string.
 *
 * This is a VALUE OBJECT — compared by its inner value, not by reference.
 */

import { checkArgument } from "../shared/preconditions";

export class ProductName {
  readonly value: string;

  constructor(value: string) {
    checkArgument(
      value != null && value.trim().length > 0,
      "Product name must not be blank",
    );
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
