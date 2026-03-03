import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreditQuotingModule } from '../credit-quoting/credit-quoting.module';
import { CREDIT_AGREEMENT_REPOSITORY } from './domain/repository/credit-agreement.repository';
import { InMemoryCreditAgreementRepository } from './infrastructure/in-memory-credit-agreement.repository';
import { CreateAgreementHandler } from './application/commands/create-agreement.command';

@Module({
  imports: [CqrsModule, CreditQuotingModule],
  providers: [
    {
      provide: CREDIT_AGREEMENT_REPOSITORY,
      useClass: InMemoryCreditAgreementRepository,
    },
    CreateAgreementHandler,
  ],
  exports: [CREDIT_AGREEMENT_REPOSITORY],
})
export class CreditAgreementModule {}
