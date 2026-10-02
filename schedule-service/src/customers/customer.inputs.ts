import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType({ description: 'Payload to create a customer' })
export class CreateCustomerInput {
    @Field({ description: 'Full name, max 150 characters' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;

    @Field({ description: 'Unique email address (case-insensitive)' })
    @IsEmail()
    @MaxLength(255)
    email!: string;
}

@InputType({ description: 'Partial customer update; only provided fields are changed' })
export class UpdateCustomerInput extends PartialType(CreateCustomerInput) { }