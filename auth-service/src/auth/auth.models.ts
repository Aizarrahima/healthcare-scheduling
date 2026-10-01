import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Registered user. Password is never exposed.' })
export class User {
    @Field(() => ID) id!: string;
    @Field() email!: string;
    @Field() createdAt!: Date;
    @Field() updatedAt!: Date;
}

@ObjectType({ description: 'Result of a successful login' })
export class AuthPayload {
    @Field({ description: 'JWT. Send as header `Authorization: Bearer <token>`' })
    accessToken!: string;

    @Field({ description: 'Always "Bearer"' })
    tokenType!: string;

    @Field(() => Int, { description: 'Token lifetime in seconds' })
    expiresIn!: number;

    @Field(() => User)
    user!: User;
}

@ObjectType({ description: 'Token validation result, consumed by other services' })
export class TokenValidation {
    @Field({ description: 'True if the signature is valid, not expired, and the user still exists' })
    valid!: boolean;

    @Field(() => User, { nullable: true })
    user!: User | null;

    @Field(() => GraphQLISODateTime, { nullable: true })
    expiresAt!: Date | null;
}