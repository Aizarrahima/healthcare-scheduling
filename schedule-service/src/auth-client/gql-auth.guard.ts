import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { AuthClientService } from './auth-client.service';
import { AuthUser } from './auth-user.interface';

@Injectable()
export class GqlAuthGuard implements CanActivate {
    constructor(private readonly authClient: AuthClientService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const { req } = GqlExecutionContext.create(context).getContext<{
            req: Request & { user?: AuthUser; };
        }>();

        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing bearer token');
        }

        req.user = await this.authClient.validateToken(header.slice('Bearer '.length).trim());
        return true;
    }
}