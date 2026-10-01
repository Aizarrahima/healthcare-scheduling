import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EMAIL_QUEUE } from './email-job';
import { NotificationProducer } from './notification.producer';

@Module({
    imports: [BullModule.registerQueue({ name: EMAIL_QUEUE })],
    providers: [NotificationProducer],
    exports: [NotificationProducer],
})
export class NotificationsModule { }