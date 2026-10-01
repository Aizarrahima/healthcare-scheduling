import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
    @Field({ description: 'Unique email address' })
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @Field({ description: 'Minimum 8 characters (bcrypt only uses the first 72 bytes)' })
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password!: string;
}

@InputType()
export class LoginInput {
    @Field()
    @IsEmail()
    email!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    password!: string;
}