import { ArgsType, Field, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationArgs } from '../common/pagination';

@InputType({ description: 'Payload to book a consultation' })
export class CreateScheduleInput {
    @Field({ description: 'Purpose of the consultation, max 500 characters' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    objective!: string;

    @Field(() => ID, { description: 'UUID of an existing customer' })
    @IsUUID()
    customerId!: string;

    @Field(() => ID, { description: 'UUID of an existing doctor' })
    @IsUUID()
    doctorId!: string;

    @Field({ description: 'Start time in ISO 8601 (e.g. "2026-10-10T03:00:00.000Z"); must be in the future' })
    @IsDate()
    scheduledAt!: Date;
}

@ArgsType()
export class SchedulesArgs extends PaginationArgs {
    @Field(() => ID, { nullable: true, description: 'Only schedules for this doctor' })
    @IsOptional()
    @IsUUID()
    doctorId?: string;

    @Field(() => ID, { nullable: true, description: 'Only schedules for this customer' })
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @Field({ nullable: true, description: 'Only schedules at or after this time (inclusive)' })
    @IsOptional()
    @IsDate()
    from?: Date;

    @Field({ nullable: true, description: 'Only schedules at or before this time (inclusive)' })
    @IsOptional()
    @IsDate()
    to?: Date;
}