import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoginInput, RegisterInput } from './auth.inputs';
import { AuthPayload, TokenValidation, User } from './auth.models';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) { }

    @Mutation(() => User, { description: 'Register a new user with email and password' })
    register(@Args('input') input: RegisterInput) {
        return this.authService.register(input);
    }

    @Mutation(() => AuthPayload, { description: 'Log in and receive a JWT access token' })
    login(@Args('input') input: LoginInput) {
        return this.authService.login(input);
    }

    @Query(() => TokenValidation, {
        description: 'Validate a JWT and return the user. Called by other services.',
    })
    validateToken(@Args('token') token: string) {
        return this.authService.validateToken(token);
    }
}