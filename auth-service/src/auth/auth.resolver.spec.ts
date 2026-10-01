import { AuthResolver } from './auth.resolver';

describe('AuthResolver', () => {
    it('delegates to AuthService', async () => {
        const service = {
            register: jest.fn().mockResolvedValue('user'),
            login: jest.fn().mockResolvedValue('payload'),
            validateToken: jest.fn().mockResolvedValue('validation'),
        };
        const resolver = new AuthResolver(service as never);
        const credentials = { email: 'a@b.com', password: 'password123' };

        await expect(resolver.register(credentials)).resolves.toBe('user');
        await expect(resolver.login(credentials)).resolves.toBe('payload');
        await expect(resolver.validateToken('t')).resolves.toBe('validation');
        expect(service.validateToken).toHaveBeenCalledWith('t');
    });
});