import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('credit_offers')
export class CreditOfferEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bankCode: string;

  @Column()
  tierId: string;

  @Column()
  bankOfferId: string;

  @Column('decimal')
  creditAmount: number;

  @Column()
  creditCurrency: string;

  @Column('decimal')
  monthlyPayment: number;

  @Column('decimal')
  totalRepayment: number;

  @Column('decimal')
  totalInterest: number;

  @Column('decimal')
  effectiveInterestRate: number;

  @Column('int')
  termMonths: number;

  @Column('jsonb', { default: {} })
  extras: Record<string, { amount: number; currency: string }>;

  @Column()
  status: string;

  @Column()
  createdAt: string;

  @Column()
  expiresAt: string;
}
