import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Doctor, Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { buildPageInfo, PaginationArgs, toSkipTake } from '../common/pagination';
import { rethrowPrismaError } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorInput, UpdateDoctorInput } from './doctor.inputs';

const CACHE_TTL_SECONDS = 300;
const cacheKey = (id: string) => `doctor:${id}`;

@Injectable()
export class DoctorsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: CacheService,
    ) { }

    create(input: CreateDoctorInput): Promise<Doctor> {
        return this.prisma.doctor
            .create({ data: { name: input.name.trim() } })
            .catch((e: unknown) => rethrowPrismaError(e, 'Doctor'));
    }

    async findAll(args: PaginationArgs) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.doctor.findMany({ orderBy: { createdAt: 'desc' }, ...toSkipTake(args) }),
            this.prisma.doctor.count(),
        ]);
        return { items, pageInfo: buildPageInfo(total, args.page, args.limit) };
    }

    async findOne(id: string): Promise<Doctor> {
        const cached = await this.cache.get<Doctor>(cacheKey(id));
        if (cached) return cached;

        const doctor = await this.prisma.doctor.findUnique({ where: { id } });
        if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);

        await this.cache.set(cacheKey(id), doctor, CACHE_TTL_SECONDS);
        return doctor;
    }

    async update(id: string, input: UpdateDoctorInput): Promise<Doctor> {
        const data: Prisma.DoctorUpdateInput = {};
        if (input.name !== undefined) data.name = input.name.trim();

        const doctor = await this.prisma.doctor
            .update({ where: { id }, data })
            .catch((e: unknown) => rethrowPrismaError(e, 'Doctor'));
        await this.cache.del(cacheKey(id));
        return doctor;
    }

    async remove(id: string): Promise<Doctor> {
        const scheduleCount = await this.prisma.schedule.count({ where: { doctorId: id } });
        if (scheduleCount > 0) {
            throw new ConflictException(
                `Doctor still has ${scheduleCount} schedule(s); delete them first`,
            );
        }

        const doctor = await this.prisma.doctor
            .delete({ where: { id } })
            .catch((e: unknown) => rethrowPrismaError(e, 'Doctor'));
        await this.cache.del(cacheKey(id));
        return doctor;
    }
}