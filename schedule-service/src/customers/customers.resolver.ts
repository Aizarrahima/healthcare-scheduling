import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from '../common/pagination';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.inputs';
import { Customer, PaginatedCustomers } from './customer.model';
import { CustomersService } from './customers.service';

@Resolver(() => Customer)
export class CustomersResolver {
    constructor(private readonly customersService: CustomersService) { }

    @Mutation(() => Customer, { description: 'Create a new customer' })
    createCustomer(@Args('input', { description: 'Customer data' }) input: CreateCustomerInput) {
        return this.customersService.create(input);
    }

    @Mutation(() => Customer, { description: 'Update customer name and/or email' })
    updateCustomer(
        @Args('id', { type: () => ID, description: 'Customer UUID' }, ParseUUIDPipe) id: string,
        @Args('input', { description: 'Fields to update' }) input: UpdateCustomerInput,
    ) {
        return this.customersService.update(id, input);
    }

    @Query(() => PaginatedCustomers, { description: 'List customers, newest first' })
    customers(@Args() pagination: PaginationArgs) {
        return this.customersService.findAll(pagination);
    }

    @Query(() => Customer, { description: 'Get a customer by ID' })
    customer(@Args('id', { type: () => ID, description: 'Customer UUID' }, ParseUUIDPipe) id: string) {
        return this.customersService.findOne(id);
    }

    @Mutation(() => Customer, { description: 'Delete a customer (fails if they still have schedules)' })
    deleteCustomer(@Args('id', { type: () => ID, description: 'Customer UUID' }, ParseUUIDPipe) id: string) {
        return this.customersService.remove(id);
    }
}