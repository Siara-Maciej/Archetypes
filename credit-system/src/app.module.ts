import { Module } from '@nestjs/common';
import { ProductCatalogModule } from './product-catalog/product-catalog.module';
import { CreditQuotingModule } from './credit-quoting/credit-quoting.module';
import { CreditAgreementModule } from './credit-agreement/credit-agreement.module';
import { CreditController } from './presentation/credit.controller';

@Module({
  imports: [ProductCatalogModule, CreditQuotingModule, CreditAgreementModule],
  controllers: [CreditController],
})
export class AppModule {}
