import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TIER_REPOSITORY } from './domain/repository/tier.repository';
import { BANK_OFFER_REPOSITORY } from './domain/repository/bank-offer.repository';
import { InMemoryTierRepository } from './infrastructure/in-memory-tier.repository';
import { InMemoryBankOfferRepository } from './infrastructure/in-memory-bank-offer.repository';
import { DefineTierHandler } from './application/commands/define-tier.command';
import { CreateBankOfferHandler } from './application/commands/create-bank-offer.command';
import {
  FindTierByIdHandler,
  FindTiersByBankHandler,
} from './application/queries/find-tier.query';
import {
  FindBankOfferByIdHandler,
  FindBankOffersByBankHandler,
} from './application/queries/find-bank-offer.query';

const commandHandlers = [DefineTierHandler, CreateBankOfferHandler];
const queryHandlers = [
  FindTierByIdHandler,
  FindTiersByBankHandler,
  FindBankOfferByIdHandler,
  FindBankOffersByBankHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [
    { provide: TIER_REPOSITORY, useClass: InMemoryTierRepository },
    { provide: BANK_OFFER_REPOSITORY, useClass: InMemoryBankOfferRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [TIER_REPOSITORY, BANK_OFFER_REPOSITORY],
})
export class ProductCatalogModule {}
