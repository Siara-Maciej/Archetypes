import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCatalogModule } from '../product-catalog/product-catalog.module';
import { BANK_STRATEGY_REGISTRY } from './domain/services/bank-strategy-registry';
import { CREDIT_OFFER_REPOSITORY } from './domain/repository/credit-offer.repository';
import { InMemoryCreditOfferRepository } from './infrastructure/persistence/in-memory-credit-offer.repository';
import { CreditOfferEntity } from './infrastructure/entities/credit-offer.entity';
import { CachedCreditOfferQueriesService } from './infrastructure/persistence/cached-credit-offer-queries.service';
import { MapBankStrategyRegistry } from './infrastructure/registry/map-bank-strategy.registry';
import { DefaultTierMatchingPipeline } from './infrastructure/pipeline/default-tier-matching.pipeline';
import { DefaultCreditCalculationPipeline } from './infrastructure/pipeline/default-credit-calculation.pipeline';

// Reusable matching steps
import { SalaryRangeFilterStep } from './infrastructure/steps/matching/salary-range-filter.step';
import { SectorFilterStep } from './infrastructure/steps/matching/sector-filter.step';
import { CreditHistoryFilterStep } from './infrastructure/steps/matching/credit-history-filter.step';
import { TermFilterStep } from './infrastructure/steps/matching/term-filter.step';
import { DownPaymentFilterStep } from './infrastructure/steps/matching/down-payment-filter.step';
import { BestRateSelectionStep } from './infrastructure/steps/matching/best-rate-selection.step';

// Reusable calculation steps
import { AnnuityCalculationStep } from './infrastructure/steps/calculation/annuity-calculation.step';
import { DecliningBalanceStep } from './infrastructure/steps/calculation/declining-balance.step';
import { InsuranceFeeStep } from './infrastructure/steps/calculation/insurance-fee.step';
import { ProcessingFeeStep } from './infrastructure/steps/calculation/processing-fee.step';

// Bank-specific steps
import { SantanderCreditScoringStep } from './infrastructure/banks/santander/santander-credit-scoring.step';
import { PkoManualOverrideStep } from './infrastructure/banks/pko/pko-manual-override.step';
import { MBankMLScoringStep } from './infrastructure/banks/mbank/mbank-ml-scoring.step';
import { MBankPromotionalDiscountStep } from './infrastructure/banks/mbank/mbank-promotional-discount.step';

// Command handlers
import { CalculateCreditOfferHandler } from './application/commands/calculate-credit-offer.command';
import { AcceptCreditOfferHandler } from './application/commands/accept-credit-offer.command';
import { RejectCreditOfferHandler } from './application/commands/reject-credit-offer.command';

// Query handlers
import {
  GetCreditOfferHandler,
  ListActiveCreditOffersHandler,
} from './application/queries/get-credit-offer.query';

const reusableMatchingSteps = [
  SalaryRangeFilterStep,
  SectorFilterStep,
  CreditHistoryFilterStep,
  TermFilterStep,
  DownPaymentFilterStep,
  BestRateSelectionStep,
];

const reusableCalculationSteps = [
  AnnuityCalculationStep,
  DecliningBalanceStep,
  InsuranceFeeStep,
  ProcessingFeeStep,
];

const bankSpecificSteps = [
  SantanderCreditScoringStep,
  PkoManualOverrideStep,
  MBankMLScoringStep,
  MBankPromotionalDiscountStep,
];

const commandHandlers = [
  CalculateCreditOfferHandler,
  AcceptCreditOfferHandler,
  RejectCreditOfferHandler,
];

const queryHandlers = [GetCreditOfferHandler, ListActiveCreditOffersHandler];

@Module({
  imports: [
    CqrsModule,
    ProductCatalogModule,
    TypeOrmModule.forFeature([CreditOfferEntity]),
  ],
  providers: [
    // Steps (available for DI)
    ...reusableMatchingSteps,
    ...reusableCalculationSteps,
    ...bankSpecificSteps,

    // Repository
    {
      provide: CREDIT_OFFER_REPOSITORY,
      useClass: InMemoryCreditOfferRepository,
    },

    // ★ Pipeline assembly per bank — the heart of the architecture
    {
      provide: BANK_STRATEGY_REGISTRY,
      useFactory: (
        salaryFilter: SalaryRangeFilterStep,
        sectorFilter: SectorFilterStep,
        creditHistoryFilter: CreditHistoryFilterStep,
        termFilter: TermFilterStep,
        downPaymentFilter: DownPaymentFilterStep,
        bestRate: BestRateSelectionStep,
        annuity: AnnuityCalculationStep,
        declining: DecliningBalanceStep,
        insurance: InsuranceFeeStep,
        processing: ProcessingFeeStep,
        santanderScoring: SantanderCreditScoringStep,
        pkoOverride: PkoManualOverrideStep,
        mbankML: MBankMLScoringStep,
        mbankPromo: MBankPromotionalDiscountStep,
      ) =>
        new MapBankStrategyRegistry(
          new Map([
            // ─── Santander ───────────────────────────
            [
              'SANTANDER',
              {
                tierMatcher: new DefaultTierMatchingPipeline([
                  salaryFilter,
                  sectorFilter,
                  termFilter,
                  downPaymentFilter,
                  santanderScoring,
                  bestRate,
                ]),
                calculator: new DefaultCreditCalculationPipeline([
                  annuity,
                  insurance,
                  processing,
                ]),
              },
            ],

            // ─── PKO BP ──────────────────────────────
            [
              'PKO_BP',
              {
                tierMatcher: new DefaultTierMatchingPipeline([
                  salaryFilter,
                  sectorFilter,
                  termFilter,
                  downPaymentFilter,
                  creditHistoryFilter,
                  pkoOverride,
                  bestRate,
                ]),
                calculator: new DefaultCreditCalculationPipeline([
                  declining,
                  insurance,
                  processing,
                ]),
              },
            ],

            // ─── mBank ───────────────────────────────
            [
              'MBANK',
              {
                tierMatcher: new DefaultTierMatchingPipeline([
                  salaryFilter,
                  sectorFilter,
                  termFilter,
                  downPaymentFilter,
                  mbankML,
                  bestRate,
                ]),
                calculator: new DefaultCreditCalculationPipeline([
                  annuity,
                  mbankPromo,
                  insurance,
                  processing,
                ]),
              },
            ],
          ]),
        ),
      inject: [
        SalaryRangeFilterStep,
        SectorFilterStep,
        CreditHistoryFilterStep,
        TermFilterStep,
        DownPaymentFilterStep,
        BestRateSelectionStep,
        AnnuityCalculationStep,
        DecliningBalanceStep,
        InsuranceFeeStep,
        ProcessingFeeStep,
        SantanderCreditScoringStep,
        PkoManualOverrideStep,
        MBankMLScoringStep,
        MBankPromotionalDiscountStep,
      ],
    },

    // Cached queries
    CachedCreditOfferQueriesService,

    // Handlers
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [
    CREDIT_OFFER_REPOSITORY,
    BANK_STRATEGY_REGISTRY,
    CachedCreditOfferQueriesService,
  ],
})
export class CreditQuotingModule {}
