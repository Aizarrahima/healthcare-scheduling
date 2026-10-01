import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateDoctorInput {
    @Field({ description: 'Doctor full name, including title' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;
}

@InputType()
export class UpdateDoctorInput extends PartialType(CreateDoctorInput) { }