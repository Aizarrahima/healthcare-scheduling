import { Prisma } from '@prisma/client';

export const scheduleInclude = { customer: true, doctor: true } satisfies Prisma.ScheduleInclude;
export type ScheduleWithRelations = Prisma.ScheduleGetPayload<{ include: typeof scheduleInclude; }>;