import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginInput, RegisterInput } from './auth.inputs';
import { AuthPayload, TokenValidation } from './auth.models';

interface JwtPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}

const SALT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync('timing-attack-dummy', SALT_ROUNDS);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

@Injectable()
export class AuthService {
    private readonly expiresInSeconds: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        config: ConfigService,
    ) {
        this.expiresInSeconds = Number(config.get('JWT_EXPIRES_IN_SECONDS', 3600));
    }

    async register(input: RegisterInput) {
        const password = await bcrypt.hash(input.password, SALT_ROUNDS);
        try {
            return await this.prisma.user.create({
                data: { email: normalizeEmail(input.email), password },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Email is already registered');
            }
            throw error;
        }
    }

    async login(input: LoginInput): Promise<AuthPayload> {
        const user = await this.prisma.user.findUnique({
            where: { email: normalizeEmail(input.email) },
        });
        const passwordMatches = await bcrypt.compare(input.password, user?.password ?? DUMMY_HASH);
        if (!user || !passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
        return { accessToken, tokenType: 'Bearer', expiresIn: this.expiresInSeconds, user };
    }

    async validateToken(token: string): Promise<TokenValidation> {
        const invalid: TokenValidation = { valid: false, user: null, expiresAt: null };

        let payload: JwtPayload;
        try {
            payload = await this.jwt.verifyAsync<JwtPayload>(token);
        } catch {
            return invalid;
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) return invalid;

        return { valid: true, user, expiresAt: new Date(payload.exp * 1000) };
    }
}