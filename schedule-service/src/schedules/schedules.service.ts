import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { buildPageInfo, toSkipTake } from '../common/pagination';
import { rethrowPrismaError } from '../common/prisma-errors';
import { NotificationProducer } from '../notifications/notification.producer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput, SchedulesArgs } from './schedule.inputs';
import { scheduleInclude, ScheduleWithRelations } from './schedule.types';

@Injectable()
export class SchedulesService {
    private readonly slotMs: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationProducer,
        config: ConfigService,
    ) {
        this.slotMs = Number(config.get('SCHEDULE_SLOT_MINUTES', 30)) * 60_000;
    }

    async create(input: CreateScheduleInput): Promise<ScheduleWithRelations> {
        const scheduledAt = new Date(input.scheduledAt);
        if (scheduledAt.getTime() <= Date.now()) {
            throw new BadRequestException('scheduledAt must be in the future');
        }

        const schedule = await this.prisma
            .$transaction(async (tx) => {
                // Serialisasi pembuatan jadwal per dokter. Tanpa lock ini, dua request
                // bersamaan bisa sama-sama lolos cek bentrok lalu sama-sama insert.
                await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.doctorId}::text))`;
                await this.assertParticipantsExist(tx, input.customerId, input.doctorId);
                await this.assertDoctorAvailable(tx, input.doctorId, scheduledAt);

                return tx.schedule.create({
                    data: {
                        objective: input.objective.trim(),
                        customerId: input.customerId,
                        doctorId: input.doctorId,
                        scheduledAt,
                    },
                    include: scheduleInclude,
                });
            })
            .catch((e: unknown) => rethrowPrismaError(e, 'Schedule'));

        await this.notifications.scheduleCreated(schedule);
        return schedule;
    }

    async findAll(args: SchedulesArgs) {
        if (args.from && args.to && args.from > args.to) {
            throw new BadRequestException('`from` must be earlier than `to`');
        }

        const where: Prisma.ScheduleWhereInput = {
            doctorId: args.doctorId,
            customerId: args.customerId,
            ...(args.from || args.to ? { scheduledAt: { gte: args.from, lte: args.to } } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.schedule.findMany({
                where,
                include: scheduleInclude,
                orderBy: { scheduledAt: 'asc' },
                ...toSkipTake(args),
            }),
            this.prisma.schedule.count({ where }),
        ]);
        return { items, pageInfo: buildPageInfo(total, args.page, args.limit) };
    }

    async findOne(id: string): Promise<ScheduleWithRelations> {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id },
            include: scheduleInclude,
        });
        if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);
        return schedule;
    }

    async remove(id: string): Promise<ScheduleWithRelations> {
        const deleted = await this.prisma.schedule
            .delete({ where: { id }, include: scheduleInclude })
            .catch((e: unknown) => rethrowPrismaError(e, 'Schedule'));
        await this.notifications.scheduleDeleted(deleted);
        return deleted;
    }

    private async assertParticipantsExist(
        tx: Prisma.TransactionClient,
        customerId: string,
        doctorId: string,
    ): Promise<void> {
        const customer = await tx.customer.findUnique({ where: { id: customerId }, select: { id: true } });
        if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);

        const doctor = await tx.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
        if (!doctor) throw new NotFoundException(`Doctor ${doctorId} not found`);
    }

    private async assertDoctorAvailable(
        tx: Prisma.TransactionClient,
        doctorId: string,
        scheduledAt: Date,
    ): Promise<void> {
        const conflict = await tx.schedule.findFirst({
            where: {
                doctorId,
                scheduledAt: {
                    gt: new Date(scheduledAt.getTime() - this.slotMs),
                    lt: new Date(scheduledAt.getTime() + this.slotMs),
                },
            },
            select: { scheduledAt: true },
        });

        if (conflict) {
            throw new ConflictException(
                `Doctor already has a schedule at ${conflict.scheduledAt.toISOString()} ` +
                `(slot duration ${this.slotMs / 60_000} minutes)`,
            );
        }
    }
}