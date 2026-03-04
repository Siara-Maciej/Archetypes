import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('bank_offers')
export class BankOfferEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bankCode: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column('jsonb')
  sectors: { sector: string; tierIds: string[] }[];

  @Column()
  validFrom: string;

  @Column()
  validUntil: string;

  @Column('jsonb', { default: [] })
  categories: string[];

  @Column('jsonb', { default: {} })
  metadata: Record<string, string>;
}
