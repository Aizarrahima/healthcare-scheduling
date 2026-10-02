import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination';

@ObjectType({ description: 'Patient who books consultations' })
export class Customer {
    @Field(() => ID, { description: 'Customer UUID' })
    id!: string;

    @Field({ description: 'Full name' })
    name!: string;

    @Field({ description: 'Unique email address, used for schedule notifications' })
    email!: string;

    @Field({ description: 'Creation timestamp (ISO 8601, UTC)' })
    createdAt!: Date;

    @Field({ description: 'Last update timestamp (ISO 8601, UTC)' })
    updatedAt!: Date;
}

@ObjectType({ description: 'Paginated list of customers' })
export class PaginatedCustomers extends Paginated(Customer) { }