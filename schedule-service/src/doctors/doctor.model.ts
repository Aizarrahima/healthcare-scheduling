import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination';

@ObjectType({ description: 'Doctor who handles consultations' })
export class Doctor {
    @Field(() => ID, { description: 'Doctor UUID' })
    id!: string;

    @Field({ description: 'Full name, including title (e.g. "dr. Dania, Sp.PD")' })
    name!: string;

    @Field({ description: 'Creation timestamp (ISO 8601, UTC)' })
    createdAt!: Date;

    @Field({ description: 'Last update timestamp (ISO 8601, UTC)' })
    updatedAt!: Date;
}

@ObjectType({ description: 'Paginated list of doctors' })
export class PaginatedDoctors extends Paginated(Doctor) { }