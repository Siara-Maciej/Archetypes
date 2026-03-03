export class SalaryRange {
  constructor(
    readonly min: number,
    readonly max: number | null,
  ) {
    if (min < 0) throw new Error('Salary min cannot be negative');
    if (max !== null && max < min)
      throw new Error('Salary max cannot be less than min');
  }

  static of(min: number, max: number | null = null): SalaryRange {
    return new SalaryRange(min, max);
  }

  static unbounded(min: number): SalaryRange {
    return new SalaryRange(min, null);
  }

  contains(salary: number): boolean {
    if (salary < this.min) return false;
    if (this.max !== null && salary > this.max) return false;
    return true;
  }

  equals(other: SalaryRange): boolean {
    return this.min === other.min && this.max === other.max;
  }
}
