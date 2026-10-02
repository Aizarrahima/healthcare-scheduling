import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination';
import { Customer } from '../customers/customer.model';
import { Doctor } from '../doctors/doctor.model';

@ObjectType({ description: 'Consultation between a doctor and a customer' })
export class Schedule {
    @Field(() => ID, { description: 'Schedule UUID' })
    id!: string;

    @Field({ description: 'Purpose of the consultation' })
    objective!: string;

    @Field(() => ID, { description: 'UUID of the customer' })
    customerId!: string;

    @Field(() => ID, { description: 'UUID of the doctor' })
    doctorId!: string;

    @Field({ description: 'Consultation start time (ISO 8601, stored in UTC)' })
    scheduledAt!: Date;

    @Field(() => Customer, { description: 'The customer attending the consultation' })
    customer!: Customer;

    @Field(() => Doctor, { description: 'The doctor handling the consultation' })
    doctor!: Doctor;

    @Field({ description: 'Creation timestamp (ISO 8601, UTC)' })
    createdAt!: Date;

    @Field({ description: 'Last update timestamp (ISO 8601, UTC)' })
    updatedAt!: Date;
}

@ObjectType({ description: 'Paginated list of schedules' })
export class PaginatedSchedules extends Paginated(Schedule) { }