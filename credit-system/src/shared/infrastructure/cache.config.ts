import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

export async function createRedisConfig(): Promise<CacheModuleOptions> {
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const ttl = parseInt(process.env.REDIS_TTL ?? '60', 10) * 1000; // seconds → ms

  return {
    store: await redisStore({
      socket: { host, port },
      ttl,
    }),
  };
}

export function createInMemoryCacheConfig(): CacheModuleOptions {
  return {
    ttl: parseInt(process.env.REDIS_TTL ?? '60', 10) * 1000,
  };
}
