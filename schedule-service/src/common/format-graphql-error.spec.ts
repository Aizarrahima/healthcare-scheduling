import { formatGraphQLError } from './format-graphql-error';

describe('formatGraphQLError', () => {
    it('joins validation messages from the Nest original error', () => {
        const result = formatGraphQLError({
            message: 'Bad Request Exception',
            extensions: {
                code: 'BAD_REQUEST',
                originalError: {
                    message: ['email must be an email', 'password must be longer than 8 characters'],
                    statusCode: 400,
                },
            },
        });

        expect(result.message).toBe(
            'email must be an email; password must be longer than 8 characters',
        );
        expect(result.extensions).toEqual({ code: 'BAD_REQUEST', statusCode: 400 });
    });

    it('keeps a single string message from the original error', () => {
        const result = formatGraphQLError({
            message: 'Unauthorized',
            extensions: { code: 'UNAUTHENTICATED', originalError: { message: 'Missing bearer token', statusCode: 401 } },
        });
        expect(result.message).toBe('Missing bearer token');
    });

    it('falls back to the formatted message and a default code', () => {
        const result = formatGraphQLError({ message: 'Something broke' });
        expect(result.message).toBe('Something broke');
        expect(result.extensions).toEqual({ code: 'INTERNAL_SERVER_ERROR' });
    });

    it('never leaks stack traces to the client', () => {
        const result = formatGraphQLError({
            message: 'Boom',
            extensions: { code: 'INTERNAL_SERVER_ERROR', stacktrace: ['at secret/file.ts:1'] },
        });
        expect(result.extensions).not.toHaveProperty('stacktrace');
    });
});