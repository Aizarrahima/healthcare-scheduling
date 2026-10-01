import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EMAIL_QUEUE, EmailJobName, ScheduleEmailJob } from './email-job';
import { MailerService } from './mailer.service';

const formatJakarta = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'short',
    }) + ' WIB';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(private readonly mailer: MailerService) { }

    @Process(EmailJobName.ScheduleCreated)
    async handleCreated(job: Job<ScheduleEmailJob>): Promise<void> {
        const d = job.data;
        await this.mailer.send(
            d.customerEmail,
            'Konfirmasi Jadwal Konsultasi',
            [
                `Halo ${d.customerName},`,
                '',
                'Jadwal konsultasi Anda telah dibuat.',
                `Dokter    : ${d.doctorName}`,
                `Waktu     : ${formatJakarta(d.scheduledAt)}`,
                `Tujuan    : ${d.objective}`,
                `ID Jadwal : ${d.scheduleId}`,
            ].join('\n'),
        );
        this.logger.log(`Sent "created" email for schedule ${d.scheduleId}`);
    }

    @Process(EmailJobName.ScheduleDeleted)
    async handleDeleted(job: Job<ScheduleEmailJob>): Promise<void> {
        const d = job.data;
        await this.mailer.send(
            d.customerEmail,
            'Pembatalan Jadwal Konsultasi',
            [
                `Halo ${d.customerName},`,
                '',
                'Jadwal konsultasi berikut telah dibatalkan.',
                `Dokter : ${d.doctorName}`,
                `Waktu  : ${formatJakarta(d.scheduledAt)}`,
                `Tujuan : ${d.objective}`,
            ].join('\n'),
        );
        this.logger.log(`Sent "deleted" email for schedule ${d.scheduleId}`);
    }

    @OnQueueFailed()
    onFailed(job: Job<ScheduleEmailJob>, error: Error): void {
        this.logger.error(
            `Job ${job.id} (${job.name}) failed, attempt ${job.attemptsMade}: ${error.message}`,
        );
    }
}