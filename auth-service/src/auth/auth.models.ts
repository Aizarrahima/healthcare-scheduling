import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Registered user. The password hash is never exposed.' })
export class User {
    @Field(() => ID, { description: 'User UUID' })
    id!: string;

    @Field({ description: 'Unique email address, stored in lowercase' })
    email!: string;

    @Field({ description: 'Registration timestamp (ISO 8601, UTC)' })
    createdAt!: Date;

    @Field({ description: 'Last update timestamp (ISO 8601, UTC)' })
    updatedAt!: Date;
}

@ObjectType({ description: 'Result of a successful login' })
export class AuthPayload {
    @Field({ description: 'JWT access token. Send it as header `Authorization: Bearer <token>`' })
    accessToken!: string;

    @Field({ description: 'Token type, always "Bearer"' })
    tokenType!: string;

    @Field(() => Int, { description: 'Token lifetime in seconds' })
    expiresIn!: number;

    @Field(() => User, { description: 'The authenticated user' })
    user!: User;
}

@ObjectType({ description: 'Token validation result, consumed by other services' })
export class TokenValidation {
    @Field({ description: 'True if the signature is valid, the token is not expired, and the user still exists' })
    valid!: boolean;

    @Field(() => User, { nullable: true, description: 'Token owner; null when the token is invalid' })
    user!: User | null;

    @Field(() => GraphQLISODateTime, { nullable: true, description: 'Token expiry time; null when invalid' })
    expiresAt!: Date | null;
}