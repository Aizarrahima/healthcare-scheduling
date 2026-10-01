import { ArgsType, Field, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationArgs } from '../common/pagination';

@InputType()
export class CreateScheduleInput {
    @Field({ description: 'Purpose of the consultation' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    objective!: string;

    @Field(() => ID)
    @IsUUID()
    customerId!: string;

    @Field(() => ID)
    @IsUUID()
    doctorId!: string;

    @Field({ description: 'Start time, must be in the future' })
    @IsDate()
    scheduledAt!: Date;
}

@ArgsType()
export class SchedulesArgs extends PaginationArgs {
    @Field(() => ID, { nullable: true, description: 'Filter by doctor' })
    @IsOptional()
    @IsUUID()
    doctorId?: string;

    @Field(() => ID, { nullable: true, description: 'Filter by customer' })
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @Field({ nullable: true, description: 'scheduledAt >= from' })
    @IsOptional()
    @IsDate()
    from?: Date;

    @Field({ nullable: true, description: 'scheduledAt <= to' })
    @IsOptional()
    @IsDate()
    to?: Date;
}