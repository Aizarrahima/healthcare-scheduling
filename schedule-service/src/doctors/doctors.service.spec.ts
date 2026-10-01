import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DoctorsService } from './doctors.service';

const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: 'test' });

describe('DoctorsService', () => {
    const prisma = {
        doctor: {
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
    const doctor = { id: 'd1', name: 'dr. Sari', createdAt: new Date(), updatedAt: new Date() };
    let service: DoctorsService;

    beforeEach(() => {
        jest.clearAllMocks();
        cache.get.mockResolvedValue(null);
        service = new DoctorsService(prisma as never, cache as never);
    });

    it('trims name on create', async () => {
        prisma.doctor.create.mockResolvedValue(doctor);
        await service.create({ name: '  dr. Sari ' });
        expect(prisma.doctor.create).toHaveBeenCalledWith({ data: { name: 'dr. Sari' } });
    });

    it('paginates', async () => {
        prisma.doctor.findMany.mockResolvedValue([doctor]);
        prisma.doctor.count.mockResolvedValue(1);
        const result = await service.findAll({ page: 1, limit: 10 });
        expect(result.items).toHaveLength(1);
        expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('serves findOne from cache', async () => {
        cache.get.mockResolvedValue(doctor);
        await expect(service.findOne('d1')).resolves.toEqual(doctor);
        expect(prisma.doctor.findUnique).not.toHaveBeenCalled();
    });

    it('caches on a DB hit and throws NotFound on a miss', async () => {
        prisma.doctor.findUnique.mockResolvedValueOnce(doctor).mockResolvedValueOnce(null);
        await service.findOne('d1');
        expect(cache.set).toHaveBeenCalledWith('doctor:d1', doctor, 300);
        await expect(service.findOne('d2')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates and invalidates cache', async () => {
        prisma.doctor.update.mockResolvedValue(doctor);
        await service.update('d1', { name: 'dr. Sari, Sp.PD' });
        expect(cache.del).toHaveBeenCalledWith('doctor:d1');
    });

    it('maps update of a missing doctor to NotFound', async () => {
        prisma.doctor.update.mockRejectedValue(prismaError('P2025'));
        await expect(service.update('d1', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to delete a doctor who still has schedules', async () => {
        prisma.schedule.count.mockResolvedValue(1);
        await expect(service.remove('d1')).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.doctor.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates cache', async () => {
        prisma.schedule.count.mockResolvedValue(0);
        prisma.doctor.delete.mockResolvedValue(doctor);
        await service.remove('d1');
        expect(cache.del).toHaveBeenCalledWith('doctor:d1');
    });
});