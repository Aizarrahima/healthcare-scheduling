const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
};
jest.mock('ioredis', () => ({ Redis: jest.fn(() => mockRedis) }));

import { CacheService } from './cache.service';

describe('CacheService', () => {
    const config = { get: jest.fn((_key: string, fallback?: unknown) => fallback) };
    let cache: CacheService;

    beforeEach(() => {
        jest.clearAllMocks();
        cache = new CacheService(config as never);
    });

    it('parses JSON and revives ISO dates', async () => {
        mockRedis.get.mockResolvedValue(
            JSON.stringify({ id: 'x', createdAt: '2026-10-01T00:00:00.000Z' }),
        );
        const value = await cache.get<{ id: string; createdAt: Date; }>('k');
        expect(value?.createdAt).toBeInstanceOf(Date);
    });

    it('returns null on a cache miss', async () => {
        mockRedis.get.mockResolvedValue(null);
        await expect(cache.get('k')).resolves.toBeNull();
    });

    it('fails open: returns null when Redis errors', async () => {
        mockRedis.get.mockRejectedValue(new Error('ECONNREFUSED'));
        await expect(cache.get('k')).resolves.toBeNull();
    });

    it('stores JSON with a TTL', async () => {
        await cache.set('k', { a: 1 }, 60);
        expect(mockRedis.set).toHaveBeenCalledWith('k', '{"a":1}', 'EX', 60);
    });

    it('swallows errors on set and del', async () => {
        mockRedis.set.mockRejectedValue(new Error('down'));
        mockRedis.del.mockRejectedValue(new Error('down'));
        await expect(cache.set('k', 1, 60)).resolves.toBeUndefined();
        await expect(cache.del('k')).resolves.toBeUndefined();
    });

    it('closes the connection on shutdown even if quit fails', async () => {
        mockRedis.quit.mockRejectedValue(new Error('already closed'));
        await expect(cache.onModuleDestroy()).resolves.toBeUndefined();
    });
});