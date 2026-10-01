import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';
import type { ScheduleWithRelations } from '../schedules/schedule.types';
import { EMAIL_QUEUE, EmailJobName, ScheduleEmailJob } from './email-job';

const ENQUEUE_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

@Injectable()
export class NotificationProducer {
    private readonly logger = new Logger(NotificationProducer.name);

    constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<ScheduleEmailJob>) { }

    scheduleCreated(schedule: ScheduleWithRelations): Promise<void> {
        return this.enqueue(EmailJobName.ScheduleCreated, schedule);
    }

    scheduleDeleted(schedule: ScheduleWithRelations): Promise<void> {
        return this.enqueue(EmailJobName.ScheduleDeleted, schedule);
    }

    private async enqueue(name: EmailJobName, s: ScheduleWithRelations): Promise<void> {
        const payload: ScheduleEmailJob = {
            scheduleId: s.id,
            customerEmail: s.customer.email,
            customerName: s.customer.name,
            doctorName: s.doctor.name,
            objective: s.objective,
            scheduledAt: s.scheduledAt.toISOString(),
        };

        try {
            // Tanpa timeout, queue.add akan menunggu selamanya saat Redis down
            // dan request user ikut menggantung.
            await withTimeout(
                this.emailQueue.add(name, payload, {
                    attempts: 5,
                    backoff: { type: 'exponential', delay: 3000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                }),
                ENQUEUE_TIMEOUT_MS,
            );
        } catch (err) {
            // Data sudah commit; kegagalan notifikasi tidak boleh menggagalkan request.
            this.logger.error(`Failed to enqueue ${name} for ${s.id}: ${(err as Error).message}`);
        }
    }
}