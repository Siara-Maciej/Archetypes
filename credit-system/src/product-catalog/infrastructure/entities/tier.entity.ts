import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tiers')
export class TierEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bankCode: string;

  @Column()
  name: string;

  @Column()
  sector: string;

  @Column('decimal')
  salaryMin: number;

  @Column('decimal', { nullable: true })
  salaryMax: number | null;

  @Column('decimal')
  interestRate: number;

  @Column('decimal')
  maxDeductionRate: number;

  @Column('decimal')
  maxLoanToValue: number;

  @Column('int')
  minTermMonths: number;

  @Column('int')
  maxTermMonths: number;

  @Column('decimal')
  minDownPaymentRate: number;

  @Column('decimal')
  processingFee: number;

  @Column()
  insuranceRequired: boolean;

  @Column('jsonb', { default: {} })
  metadata: Record<string, string>;
}
