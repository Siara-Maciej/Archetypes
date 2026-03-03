import { randomUUID } from 'crypto';

export class TierId {
  constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TierId cannot be empty');
    }
  }

  static generate(): TierId {
    return new TierId(randomUUID());
  }

  static of(value: string): TierId {
    return new TierId(value);
  }

  equals(other: TierId): boolean {
    return this.value === other.value;
  }
}
