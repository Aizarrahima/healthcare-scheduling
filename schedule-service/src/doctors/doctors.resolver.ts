import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from '../common/pagination';
import { CreateDoctorInput, UpdateDoctorInput } from './doctor.inputs';
import { Doctor, PaginatedDoctors } from './doctor.model';
import { DoctorsService } from './doctors.service';

@Resolver(() => Doctor)
export class DoctorsResolver {
    constructor(private readonly doctorsService: DoctorsService) { }

    @Mutation(() => Doctor, { description: 'Create a new doctor' })
    createDoctor(@Args('input') input: CreateDoctorInput) {
        return this.doctorsService.create(input);
    }

    @Mutation(() => Doctor, { description: 'Update doctor data' })
    updateDoctor(
        @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
        @Args('input') input: UpdateDoctorInput,
    ) {
        return this.doctorsService.update(id, input);
    }

    @Query(() => PaginatedDoctors, { description: 'List doctors, newest first' })
    doctors(@Args() pagination: PaginationArgs) {
        return this.doctorsService.findAll(pagination);
    }

    @Query(() => Doctor, { description: 'Get a doctor by ID' })
    doctor(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
        return this.doctorsService.findOne(id);
    }

    @Mutation(() => Doctor, { description: 'Delete a doctor (fails if they still have schedules)' })
    deleteDoctor(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
        return this.doctorsService.remove(id);
    }
}