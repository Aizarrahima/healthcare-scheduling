import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { AuthClientService } from './auth-client.service';

describe('AuthClientService', () => {
    const cache = { get: jest.fn(), set: jest.fn() };
    const config = { getOrThrow: jest.fn().mockReturnValue('http://auth/graphql') };
    const fetchMock = jest.fn();
    const user = { id: 'u1', email: 'a@b.com' };
    let service: AuthClientService;

    const respond = (validateToken: unknown) => ({
        ok: true,
        json: () => Promise.resolve({ data: { validateToken } }),
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = fetchMock as unknown as typeof fetch;
        cache.get.mockResolvedValue(null);
        service = new AuthClientService(config as never, cache as never);
    });

    const originalFetch = global.fetch;
    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('returns the cached user without calling auth-service', async () => {
        cache.get.mockResolvedValue(user);
        await expect(service.validateToken('t')).resolves.toEqual(user);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('caches a valid result with TTL capped at 60s', async () => {
        fetchMock.mockResolvedValue(
            respond({ valid: true, user, expiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
        );

        await expect(service.validateToken('t')).resolves.toEqual(user);
        expect(cache.set).toHaveBeenCalledWith(expect.stringMatching(/^auth:token:/), user, 60);
    });

    it('throws Unauthorized for an invalid token', async () => {
        fetchMock.mockResolvedValue(respond({ valid: false, user: null, expiresAt: null }));
        await expect(service.validateToken('t')).rejects.toBeInstanceOf(UnauthorizedException);
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailable when auth-service is unreachable', async () => {
        fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
        await expect(service.validateToken('t')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
});