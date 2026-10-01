import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviveDates = (_key: string, value: unknown) =>
    typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value;

/**
 * Fail-open cache: kalau Redis mati, request tetap jalan (cache miss),
 * bukan ikut gagal.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private readonly redis: Redis;

    constructor(config: ConfigService) {
        this.redis = new Redis({
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: Number(config.get('REDIS_PORT', 6379)),
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
        });
        this.redis.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const raw = await this.redis.get(key);
            return raw ? (JSON.parse(raw, reviveDates) as T) : null;
        } catch {
            return null;
        }
    }

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (err) {
            this.logger.warn(`Cache set failed for ${key}: ${(err as Error).message}`);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch {
            /* fail-open */
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis.quit().catch(() => undefined);
    }
}