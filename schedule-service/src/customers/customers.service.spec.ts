import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomersService } from './customers.service';

const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: 'test' });

describe('CustomersService', () => {
    const prisma = {
        customer: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        schedule: { count: jest.fn() },
        $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    const customer = {
        id: 'c1',
        name: 'Budi',
        email: 'budi@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    let service: CustomersService;

    beforeEach(() => {
        jest.clearAllMocks();
        cache.get.mockResolvedValue(null);
        service = new CustomersService(prisma as never, cache as never);
    });

    it('trims name and normalizes email on create', async () => {
        prisma.customer.create.mockResolvedValue(customer);
        await service.create({ name: '  Budi ', email: ' BUDI@Example.com ' });
        expect(prisma.customer.create).toHaveBeenCalledWith({
            data: { name: 'Budi', email: 'budi@example.com' },
        });
    });

    it('maps duplicate email to ConflictException', async () => {
        prisma.customer.create.mockRejectedValue(prismaError('P2002'));
        await expect(
            service.create({ name: 'Budi', email: 'budi@example.com' }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('paginates and builds pageInfo', async () => {
        prisma.customer.findMany.mockResolvedValue([customer]);
        prisma.customer.count.mockResolvedValue(11);

        const result = await service.findAll({ page: 2, limit: 10 });

        expect(prisma.customer.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 10, take: 10 }),
        );
        expect(result.pageInfo).toEqual({
            total: 11,
            page: 2,
            limit: 10,
            totalPages: 2,
            hasNextPage: false,
        });
    });

    it('serves findOne from cache without hitting the DB', async () => {
        cache.get.mockResolvedValue(customer);
        await expect(service.findOne('c1')).resolves.toEqual(customer);
        expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    });

    it('loads from DB and populates cache on a miss', async () => {
        prisma.customer.findUnique.mockResolvedValue(customer);
        await service.findOne('c1');
        expect(cache.set).toHaveBeenCalledWith('customer:c1', customer, 300);
    });

    it('throws NotFoundException when the customer does not exist', async () => {
        prisma.customer.findUnique.mockResolvedValue(null);
        await expect(service.findOne('c1')).rejects.toBeInstanceOf(NotFoundException);
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('updates only provided fields and invalidates cache', async () => {
        prisma.customer.update.mockResolvedValue(customer);
        await service.update('c1', { name: ' Budi S ' });
        expect(prisma.customer.update).toHaveBeenCalledWith({
            where: { id: 'c1' },
            data: { name: 'Budi S' },
        });
        expect(cache.del).toHaveBeenCalledWith('customer:c1');
    });

    it('maps update of a missing customer to NotFoundException', async () => {
        prisma.customer.update.mockRejectedValue(prismaError('P2025'));
        await expect(service.update('c1', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
        expect(cache.del).not.toHaveBeenCalled();
    });

    it('refuses to delete a customer who still has schedules', async () => {
        prisma.schedule.count.mockResolvedValue(2);
        await expect(service.remove('c1')).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.customer.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates cache', async () => {
        prisma.schedule.count.mockResolvedValue(0);
        prisma.customer.delete.mockResolvedValue(customer);
        await expect(service.remove('c1')).resolves.toEqual(customer);
        expect(cache.del).toHaveBeenCalledWith('customer:c1');
    });
});