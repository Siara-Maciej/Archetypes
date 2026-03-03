import type { Sector } from '../../product-catalog/domain/value-objects/sector';
import type { EmploymentType } from '../../product-catalog/domain/value-objects/employment-type';

export class CustomerDto {
  sector: Sector;
  employmentType: EmploymentType;
  netMonthlySalary: number;
  monthlyObligations: number;
  employmentMonths: number;
}

export class VehicleDto {
  price: number;
  isNew: boolean;
  year: number;
}

export class CalculateCreditDto {
  bankOfferId: string;
  customer: CustomerDto;
  vehicle: VehicleDto;
  requestedTermMonths: number;
  downPayment: number;
  currency?: string;
}
