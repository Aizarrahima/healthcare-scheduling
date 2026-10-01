import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { buildPageInfo, PaginationArgs, toSkipTake } from '../common/pagination';
import { rethrowPrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.inputs';

const CACHE_TTL_SECONDS = 300;
const cacheKey = (id: string) => `customer:${id}`;
const normalizeEmail = (email: string) => email.trim().toLowerCase();

@Injectable()
export class CustomersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: CacheService,
    ) { }

    create(input: CreateCustomerInput): Promise<Customer> {
        return this.prisma.customer
            .create({ data: { name: input.name.trim(), email: normalizeEmail(input.email) } })
            .catch((e: unknown) => rethrowPrismaError(e, 'Customer'));
    }

    async findAll(args: PaginationArgs) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' }, ...toSkipTake(args) }),
            this.prisma.customer.count(),
        ]);
        return { items, pageInfo: buildPageInfo(total, args.page, args.limit) };
    }

    async findOne(id: string): Promise<Customer> {
        const cached = await this.cache.get<Customer>(cacheKey(id));
        if (cached) return cached;

        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer) throw new NotFoundException(`Customer ${id} not found`);

        await this.cache.set(cacheKey(id), customer, CACHE_TTL_SECONDS);
        return customer;
    }

    async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
        const data: Prisma.CustomerUpdateInput = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.email !== undefined) data.email = normalizeEmail(input.email);

        const customer = await this.prisma.customer
            .update({ where: { id }, data })
            .catch((e: unknown) => rethrowPrismaError(e, 'Customer'));
        await this.cache.del(cacheKey(id));
        return customer;
    }

    async remove(id: string): Promise<Customer> {
        const scheduleCount = await this.prisma.schedule.count({ where: { customerId: id } });
        if (scheduleCount > 0) {
            throw new ConflictException(
                `Customer still has ${scheduleCount} schedule(s); delete them first`,
            );
        }

        const customer = await this.prisma.customer
            .delete({ where: { id } })
            .catch((e: unknown) => rethrowPrismaError(e, 'Customer'));
        await this.cache.del(cacheKey(id));
        return customer;
    }
}