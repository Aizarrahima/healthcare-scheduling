import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination';
import { Customer } from '../customers/customer.model';
import { Doctor } from '../doctors/doctor.model';

@ObjectType({ description: 'Consultation between a doctor and a customer' })
export class Schedule {
    @Field(() => ID) id!: string;
    @Field({ description: 'Purpose of the consultation' }) objective!: string;
    @Field(() => ID) customerId!: string;
    @Field(() => ID) doctorId!: string;
    @Field({ description: 'Start time (ISO 8601, stored in UTC)' }) scheduledAt!: Date;
    @Field(() => Customer) customer!: Customer;
    @Field(() => Doctor) doctor!: Doctor;
    @Field() createdAt!: Date;
    @Field() updatedAt!: Date;
}

@ObjectType()
export class PaginatedSchedules extends Paginated(Schedule) { }