import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    const prisma = { user: { create: jest.fn(), findUnique: jest.fn() } };
    const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: 60 } });
    const config = { get: jest.fn().mockReturnValue(60) };
    const baseUser = {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'a@b.com',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    let service: AuthService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AuthService(prisma as never, jwt, config as never);
    });

    it('hashes the password and normalizes email on register', async () => {
        prisma.user.create.mockImplementation(({ data }: { data: Record<string, string>; }) =>
            Promise.resolve({ ...baseUser, ...data }),
        );

        await service.register({ email: '  A@B.com ', password: 'password123' });

        const { data } = prisma.user.create.mock.calls[0][0];
        expect(data.email).toBe('a@b.com');
        expect(data.password).not.toBe('password123');
        expect(await bcrypt.compare('password123', data.password)).toBe(true);
    });

    it('maps duplicate email to ConflictException', async () => {
        prisma.user.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('Unique', { code: 'P2002', clientVersion: 'test' }),
        );
        await expect(
            service.register({ email: 'a@b.com', password: 'password123' }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('returns a verifiable JWT on valid login', async () => {
        prisma.user.findUnique.mockResolvedValue({
            ...baseUser,
            password: await bcrypt.hash('password123', 4),
        });

        const result = await service.login({ email: 'a@b.com', password: 'password123' });

        expect(result.tokenType).toBe('Bearer');
        const payload = await jwt.verifyAsync<{ sub: string; }>(result.accessToken);
        expect(payload.sub).toBe(baseUser.id);
    });

    it('rejects a wrong password', async () => {
        prisma.user.findUnique.mockResolvedValue({
            ...baseUser,
            password: await bcrypt.hash('password123', 4),
        });
        await expect(service.login({ email: 'a@b.com', password: 'wrong-pass' })).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('rejects an unknown email', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(
            service.login({ email: 'x@y.com', password: 'password123' }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('validateToken returns the user for a valid token', async () => {
        prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: 'hash' });
        const token = await jwt.signAsync({ sub: baseUser.id, email: baseUser.email });

        const result = await service.validateToken(token);

        expect(result.valid).toBe(true);
        expect(result.user?.id).toBe(baseUser.id);
        expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('validateToken returns valid=false for a garbage token', async () => {
        const result = await service.validateToken('not-a-jwt');
        expect(result).toEqual({ valid: false, user: null, expiresAt: null });
    });

    it('validateToken returns valid=false when the user no longer exists', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        const token = await jwt.signAsync({ sub: baseUser.id, email: baseUser.email });
        expect((await service.validateToken(token)).valid).toBe(false);
    });
});