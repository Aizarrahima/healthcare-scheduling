export const EMAIL_QUEUE = 'email';

export enum EmailJobName {
    ScheduleCreated = 'schedule-created',
    ScheduleDeleted = 'schedule-deleted',
}

export interface ScheduleEmailJob {
    scheduleId: string;
    customerEmail: string;
    customerName: string;
    doctorName: string;
    objective: string;
    scheduledAt: string; // ISO 8601
}