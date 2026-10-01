import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateCustomerInput {
    @Field({ description: 'Full name' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;

    @Field({ description: 'Unique email address' })
    @IsEmail()
    @MaxLength(255)
    email!: string;
}

@InputType()
export class UpdateCustomerInput extends PartialType(CreateCustomerInput) { }