import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateScheduleInput, SchedulesArgs } from './schedule.inputs';
import { PaginatedSchedules, Schedule } from './schedule.model';
import { SchedulesService } from './schedules.service';

@Resolver(() => Schedule)
export class SchedulesResolver {
    constructor(private readonly schedulesService: SchedulesService) { }

    @Mutation(() => Schedule, {
        description:
            'Book a consultation. Rejected if the doctor already has a schedule within the slot window.',
    })
    createSchedule(@Args('input') input: CreateScheduleInput) {
        return this.schedulesService.create(input);
    }

    @Query(() => PaginatedSchedules, {
        description: 'List schedules with optional filters, ordered by scheduledAt ascending',
    })
    schedules(@Args() args: SchedulesArgs) {
        return this.schedulesService.findAll(args);
    }

    @Query(() => Schedule, { description: 'Get a schedule by ID' })
    schedule(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
        return this.schedulesService.findOne(id);
    }

    @Mutation(() => Schedule, { description: 'Delete a schedule and notify the customer' })
    deleteSchedule(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
        return this.schedulesService.remove(id);
    }
}