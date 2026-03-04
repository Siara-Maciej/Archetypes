import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ProductCatalogModule } from './product-catalog/product-catalog.module';
import { CreditQuotingModule } from './credit-quoting/credit-quoting.module';
import { CreditAgreementModule } from './credit-agreement/credit-agreement.module';
import { CreditController } from './presentation/credit.controller';

@Module({
  imports: [
    // ─── Configuration ────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ─── PostgreSQL via TypeORM ───────────────────────
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username: process.env.DATABASE_USER ?? 'credit',
      password: process.env.DATABASE_PASSWORD ?? 'credit',
      database: process.env.DATABASE_NAME ?? 'credit_system',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),

    // ─── Redis Cache ──────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        if (process.env.REDIS_HOST) {
          const { redisStore } = await import('cache-manager-redis-yet');
          return {
            store: await redisStore({
              socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
              },
              ttl: parseInt(process.env.REDIS_TTL ?? '60', 10) * 1000,
            }),
          };
        }
        // Fallback to in-memory cache when Redis is not configured
        return {
          ttl: parseInt(process.env.REDIS_TTL ?? '60', 10) * 1000,
        };
      },
    }),

    // ─── Winston Logger ───────────────────────────────
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: process.env.LOG_LEVEL ?? 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            process.env.NODE_ENV === 'production'
              ? winston.format.json()
              : winston.format.combine(
                  winston.format.colorize(),
                  winston.format.printf(
                    ({ timestamp, level, message, context, ...meta }) => {
                      const ctx = context ? `[${context}]` : '';
                      const extra = Object.keys(meta).length
                        ? ` ${JSON.stringify(meta)}`
                        : '';
                      return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                    },
                  ),
                ),
          ),
        }),
      ],
    }),

    // ─── Domain Modules ───────────────────────────────
    ProductCatalogModule,
    CreditQuotingModule,
    CreditAgreementModule,
  ],
  controllers: [CreditController],
})
export class AppModule {}
