import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';

describe('GqlAuthGuard', () => {
    const authClient = { validateToken: jest.fn() };
    const guard = new GqlAuthGuard(authClient as never);

    const contextWith = (authorization?: string) => {
        const req: { headers: { authorization?: string; }; user?: unknown; } = {
            headers: { authorization },
        };
        jest
            .spyOn(GqlExecutionContext, 'create')
            .mockReturnValue({ getContext: () => ({ req }) } as never);
        return { context: {} as ExecutionContext, req };
    };

    afterEach(() => jest.restoreAllMocks());

    it('rejects a request without Authorization header', async () => {
        const { context } = contextWith(undefined);
        await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
        expect(authClient.validateToken).not.toHaveBeenCalled();
    });

    it('rejects a non-Bearer scheme', async () => {
        const { context } = contextWith('Basic abc');
        await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('attaches the validated user to the request', async () => {
        const user = { id: 'u1', email: 'a@b.com' };
        authClient.validateToken.mockResolvedValue(user);
        const { context, req } = contextWith('Bearer  my-token ');

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(authClient.validateToken).toHaveBeenCalledWith('my-token');
        expect(req.user).toEqual(user);
    });
});