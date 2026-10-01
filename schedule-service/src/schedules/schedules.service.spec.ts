import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SchedulesArgs } from './schedule.inputs';
import { SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
    const customerId = '11111111-1111-4111-8111-111111111111';
    const doctorId = '22222222-2222-4222-8222-222222222222';

    const tx = {
        $executeRaw: jest.fn(),
        customer: { findUnique: jest.fn() },
        doctor: { findUnique: jest.fn() },
        schedule: { findFirst: jest.fn(), create: jest.fn() },
    };
    const prisma = {
        $transaction: jest.fn((arg: unknown) =>
            typeof arg === 'function' ? arg(tx) : Promise.all(arg as Promise<unknown>[]),
        ),
        schedule: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    };
    const notifications = { scheduleCreated: jest.fn(), scheduleDeleted: jest.fn() };
    const config = { get: jest.fn().mockReturnValue(30) };
    let service: SchedulesService;

    const inFuture = () => new Date(Date.now() + 86_400_000);
    const input = (overrides = {}) => ({
        objective: 'General checkup',
        customerId,
        doctorId,
        scheduledAt: inFuture(),
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
        tx.customer.findUnique.mockResolvedValue({ id: customerId });
        tx.doctor.findUnique.mockResolvedValue({ id: doctorId });
        tx.schedule.findFirst.mockResolvedValue(null);
        tx.schedule.create.mockImplementation(({ data }: { data: Record<string, unknown>; }) =>
            Promise.resolve({
                id: 'schedule-1',
                ...data,
                customer: { id: customerId, name: 'Budi', email: 'budi@example.com' },
                doctor: { id: doctorId, name: 'dr. Sari' },
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        );
        service = new SchedulesService(prisma as never, notifications as never, config as never);
    });

    it('creates a schedule under an advisory lock and enqueues a notification', async () => {
        const result = await service.create(input());

        expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
        expect(result.id).toBe('schedule-1');
        expect(notifications.scheduleCreated).toHaveBeenCalledWith(result);
    });

    it('rejects a schedule in the past without opening a transaction', async () => {
        await expect(
            service.create(input({ scheduledAt: new Date(Date.now() - 60_000) })),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an unknown customer', async () => {
        tx.customer.findUnique.mockResolvedValue(null);
        await expect(service.create(input())).rejects.toBeInstanceOf(NotFoundException);
        expect(tx.schedule.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown doctor', async () => {
        tx.doctor.findUnique.mockResolvedValue(null);
        await expect(service.create(input())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a conflicting schedule and sends no notification', async () => {
        tx.schedule.findFirst.mockResolvedValue({ scheduledAt: inFuture() });

        await expect(service.create(input())).rejects.toBeInstanceOf(ConflictException);
        expect(tx.schedule.create).not.toHaveBeenCalled();
        expect(notifications.scheduleCreated).not.toHaveBeenCalled();
    });

    it('checks conflicts within +/- slot duration', async () => {
        const at = inFuture();
        await service.create(input({ scheduledAt: at }));

        const { where } = tx.schedule.findFirst.mock.calls[0][0];
        expect(where.scheduledAt.gt.getTime()).toBe(at.getTime() - 30 * 60_000);
        expect(where.scheduledAt.lt.getTime()).toBe(at.getTime() + 30 * 60_000);
    });

    it('maps a unique-constraint race to ConflictException', async () => {
        tx.schedule.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('Unique', { code: 'P2002', clientVersion: 'test' }),
        );
        await expect(service.create(input())).rejects.toBeInstanceOf(ConflictException);
    });

    it('paginates and builds pageInfo', async () => {
        prisma.schedule.findMany.mockResolvedValue([{ id: 's1' }]);
        prisma.schedule.count.mockResolvedValue(25);

        const result = await service.findAll({ page: 2, limit: 10 } as SchedulesArgs);

        expect(prisma.schedule.findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 10 });
        expect(result.pageInfo).toEqual({
            total: 25,
            page: 2,
            limit: 10,
            totalPages: 3,
            hasNextPage: true,
        });
    });

    it('rejects an inverted date range', async () => {
        await expect(
            service.findAll({
                page: 1,
                limit: 10,
                from: new Date('2030-01-02'),
                to: new Date('2030-01-01'),
            } as SchedulesArgs),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a missing schedule on delete to NotFoundException', async () => {
        prisma.schedule.delete.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: 'test' }),
        );
        await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
        expect(notifications.scheduleDeleted).not.toHaveBeenCalled();
    });

    it('notifies the customer after deleting', async () => {
        const deleted = { id: 's1', customer: {}, doctor: {} };
        prisma.schedule.delete.mockResolvedValue(deleted);

        await service.remove('s1');

        expect(notifications.scheduleDeleted).toHaveBeenCalledWith(deleted);
    });
});