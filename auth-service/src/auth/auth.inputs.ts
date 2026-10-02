import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

@InputType({ description: 'Payload to create a new account' })
export class RegisterInput {
    @Field({ description: 'Unique email address (case-insensitive)' })
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @Field({ description: 'Password, 8–72 characters (bcrypt only uses the first 72 bytes)' })
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password!: string;
}

@InputType({ description: 'Credentials to obtain an access token' })
export class LoginInput {
    @Field({ description: 'Registered email address' })
    @IsEmail()
    email!: string;

    @Field({ description: 'Account password' })
    @IsString()
    @IsNotEmpty()
    password!: string;
}