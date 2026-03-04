import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

export function createLogger() {
  return WinstonModule.createLogger({
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
                winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                  const ctx = context ? `[${context}]` : '';
                  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                }),
              ),
        ),
      }),
    ],
  });
}
