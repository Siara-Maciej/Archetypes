import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('credit_agreements')
export class CreditAgreementEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  agreementNumber: string;

  @Column()
  bankCode: string;

  @Column()
  creditOfferId: string;

  @Column()
  tierId: string;

  @Column('decimal')
  creditAmount: number;

  @Column()
  creditCurrency: string;

  @Column('decimal')
  monthlyPayment: number;

  @Column('decimal')
  interestRate: number;

  @Column('int')
  termMonths: number;

  @Column()
  status: string;

  @Column()
  signedAt: string;
}
