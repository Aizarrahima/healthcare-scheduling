import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType({ description: 'Payload to create a doctor' })
export class CreateDoctorInput {
    @Field({ description: 'Full name including title, max 150 characters' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;
}

@InputType({ description: 'Partial doctor update; only provided fields are changed' })
export class UpdateDoctorInput extends PartialType(CreateDoctorInput) { }