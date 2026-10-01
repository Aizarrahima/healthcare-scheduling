import {
    Injectable,
    Logger,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { CacheService } from '../cache/cache.service';
import { AuthUser } from './auth-user.interface';

interface ValidateTokenResult {
    valid: boolean;
    expiresAt: string | null;
    user: AuthUser | null;
}

const VALIDATE_TOKEN_QUERY = `
  query ValidateToken($token: String!) {
    validateToken(token: $token) { valid expiresAt user { id email } }
  }
`;

const MAX_CACHE_TTL_SECONDS = 60;
const AUTH_TIMEOUT_MS = 3000;

@Injectable()
export class AuthClientService {
    private readonly logger = new Logger(AuthClientService.name);
    private readonly authUrl: string;

    constructor(
        config: ConfigService,
        private readonly cache: CacheService,
    ) {
        this.authUrl = config.getOrThrow<string>('AUTH_SERVICE_URL');
    }

    async validateToken(token: string): Promise<AuthUser> {
        // Hash token supaya token mentah tidak pernah tersimpan di Redis.
        const cacheKey = `auth:token:${createHash('sha256').update(token).digest('hex')}`;
        const cached = await this.cache.get<AuthUser>(cacheKey);
        if (cached) return cached;

        const result = await this.callAuthService(token);
        if (!result?.valid || !result.user) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const secondsLeft = result.expiresAt
            ? Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)
            : 0;
        const ttl = Math.min(MAX_CACHE_TTL_SECONDS, secondsLeft);
        if (ttl > 0) await this.cache.set(cacheKey, result.user, ttl);

        return result.user;
    }

    private async callAuthService(token: string): Promise<ValidateTokenResult | null> {
        let response: Response;
        try {
            response = await fetch(this.authUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ query: VALIDATE_TOKEN_QUERY, variables: { token } }),
                signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
            });
        } catch (err) {
            this.logger.error(`Auth service unreachable: ${(err as Error).message}`);
            throw new ServiceUnavailableException('Authentication service unavailable');
        }

        if (!response.ok) {
            this.logger.error(`Auth service responded ${response.status}`);
            throw new ServiceUnavailableException('Authentication service error');
        }

        const body = (await response.json()) as { data?: { validateToken?: ValidateTokenResult; }; };
        return body.data?.validateToken ?? null;
    }
}