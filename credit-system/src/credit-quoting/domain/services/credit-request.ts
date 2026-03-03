import { Money } from '../../../shared/domain/money';
import { EmploymentType } from '../../../product-catalog/domain/value-objects/employment-type';
import { Sector } from '../../../product-catalog/domain/value-objects/sector';

export interface CustomerData {
  readonly sector: Sector;
  readonly employmentType: EmploymentType;
  readonly netMonthlySalary: number;
  readonly monthlyObligations: number;
  readonly employmentMonths: number;
}

export interface VehicleData {
  readonly price: Money;
  readonly isNew: boolean;
  readonly year: number;
}

export interface CreditRequest {
  readonly customer: CustomerData;
  readonly vehicle: VehicleData;
  readonly requestedTermMonths: number;
  readonly downPayment: Money;
  readonly bankOfferId: string;
}
