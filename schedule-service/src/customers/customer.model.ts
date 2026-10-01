import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination';

@ObjectType({ description: 'Patient who books consultations' })
export class Customer {
    @Field(() => ID) id!: string;
    @Field() name!: string;
    @Field({ description: 'Unique; used for schedule notifications' }) email!: string;
    @Field() createdAt!: Date;
    @Field() updatedAt!: Date;
}

@ObjectType()
export class PaginatedCustomers extends Paginated(Customer) { }