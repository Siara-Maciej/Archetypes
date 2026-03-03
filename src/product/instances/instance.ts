/**
 * Instance — a specific exemplar of a Product that was created/sold/delivered.
 *
 * WHY: Product (ProductType/PackageType) defines WHAT something IS.
 *      Instance defines WHAT WAS ACTUALLY CREATED — a concrete item
 *      with a serial number, batch ID, and specific feature values.
 *
 * WHAT:
 *   InstanceId      — unique identifier for any instance
 *   Instance        — common interface for ProductInstance and PackageInstance
 *   ProductInstance — instance of a ProductType (phone with serial ABC123)
 *   PackageInstance — instance of a PackageType (bundle with specific choices)
 *
 * TRACKING: Every instance must be traceable via at least one of:
 *   - SerialNumber (individual tracking)
 *   - BatchId (group/batch tracking)
 *   The required tracking method is determined by the Product's tracking strategy.
 */

import { randomUUID } from "crypto";
import { Product } from "../domain/product";
import { SerialNumber } from "./serial-number";

// ─── InstanceId ───────────────────────────────────────────────────────────────

export class InstanceId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static newOne(): InstanceId {
    return new InstanceId(randomUUID());
  }

  static of(value: string): InstanceId {
    return new InstanceId(value);
  }

  toString(): string {
    return this.value;
  }
}

// ─── BatchId ──────────────────────────────────────────────────────────────────

export class BatchId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static newOne(): BatchId {
    return new BatchId(randomUUID());
  }

  static of(value: string): BatchId {
    return new BatchId(value);
  }

  toString(): string {
    return this.value;
  }
}

// ─── Instance Interface ───────────────────────────────────────────────────────

export interface Instance {
  readonly id: InstanceId;
  readonly product: Product;
  readonly serialNumber: SerialNumber | undefined;
  readonly batchId: BatchId | undefined;
}
