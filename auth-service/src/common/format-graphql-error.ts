import type { GraphQLFormattedError } from 'graphql';

interface NestErrorBody {
    message?: string | string[];
    statusCode?: number;
}

/** Makes validation errors readable and strips stack traces from responses. */
export function formatGraphQLError(formatted: GraphQLFormattedError): GraphQLFormattedError {
    const original = formatted.extensions?.originalError as NestErrorBody | undefined;
    const message = Array.isArray(original?.message)
        ? original.message.join('; ')
        : (original?.message ?? formatted.message);

    return {
        message,
        path: formatted.path,
        extensions: {
            code: formatted.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
            ...(original?.statusCode ? { statusCode: original.statusCode } : {}),
        },
    };
}