import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination';

@ObjectType({ description: 'Doctor who handles consultations' })
export class Doctor {
    @Field(() => ID) id!: string;
    @Field() name!: string;
    @Field() createdAt!: Date;
    @Field() updatedAt!: Date;
}

@ObjectType()
export class PaginatedDoctors extends Paginated(Doctor) { }