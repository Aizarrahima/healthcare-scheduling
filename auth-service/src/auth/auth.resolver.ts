import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoginInput, RegisterInput } from './auth.inputs';
import { AuthPayload, TokenValidation, User } from './auth.models';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) { }

    @Mutation(() => User, { description: 'Register a new user with email and password' })
    register(@Args('input', { description: 'New account data' }) input: RegisterInput) {
        return this.authService.register(input);
    }

    @Mutation(() => AuthPayload, { description: 'Log in and receive a JWT access token' })
    login(@Args('input', { description: 'Login credentials' }) input: LoginInput) {
        return this.authService.login(input);
    }

    @Query(() => TokenValidation, {
        description: 'Validate a JWT and return the user. Called by other services.',
    })
    validateToken(@Args('token', { description: 'JWT access token, without the "Bearer " prefix' }) token: string) {
        return this.authService.validateToken(token);
    }
}