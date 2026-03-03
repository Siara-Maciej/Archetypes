import { BankCode } from '../../../shared/domain';
import { Rate } from '../../../shared/domain/rate';
import { Months } from '../../../shared/domain/months';
import { SalaryRange } from '../value-objects/salary-range';
import { Sector } from '../value-objects/sector';
import { TierId } from '../value-objects/tier-id';

export interface TierProps {
  id: TierId;
  bankCode: BankCode;
  name: string;
  sector: Sector;
  salaryRange: SalaryRange;
  interestRate: Rate;
  maxDeductionRate: Rate;
  maxLoanToValue: Rate;
  minTerm: Months;
  maxTerm: Months;
  minDownPaymentRate: Rate;
  processingFee: Rate;
  insuranceRequired: boolean;
  metadata: Record<string, string>;
}

/**
 * Tier = ProductType in the Product Archetype.
 *
 * Defines a credit product's financial parameters for a specific
 * salary range and sector. Exists independently of any customer.
 */
export class Tier {
  readonly id: TierId;
  readonly bankCode: BankCode;
  readonly name: string;
  readonly sector: Sector;
  readonly salaryRange: SalaryRange;
  readonly interestRate: Rate;
  readonly maxDeductionRate: Rate;
  readonly maxLoanToValue: Rate;
  readonly minTerm: Months;
  readonly maxTerm: Months;
  readonly minDownPaymentRate: Rate;
  readonly processingFee: Rate;
  readonly insuranceRequired: boolean;
  readonly metadata: Record<string, string>;

  constructor(props: TierProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Tier name cannot be empty');
    }
    if (props.maxTerm.value < props.minTerm.value) {
      throw new Error('maxTerm cannot be less than minTerm');
    }
    this.id = props.id;
    this.bankCode = props.bankCode;
    this.name = props.name;
    this.sector = props.sector;
    this.salaryRange = props.salaryRange;
    this.interestRate = props.interestRate;
    this.maxDeductionRate = props.maxDeductionRate;
    this.maxLoanToValue = props.maxLoanToValue;
    this.minTerm = props.minTerm;
    this.maxTerm = props.maxTerm;
    this.minDownPaymentRate = props.minDownPaymentRate;
    this.processingFee = props.processingFee;
    this.insuranceRequired = props.insuranceRequired;
    this.metadata = { ...props.metadata };
  }

  matchesSalary(salary: number): boolean {
    return this.salaryRange.contains(salary);
  }

  matchesSector(sector: Sector): boolean {
    return this.sector === sector;
  }

  isTermAllowed(termMonths: number): boolean {
    return new Months(termMonths).isWithin(this.minTerm, this.maxTerm);
  }
}
