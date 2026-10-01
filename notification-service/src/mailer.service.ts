import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
    private readonly transporter: Transporter;
    private readonly from: string;

    constructor(config: ConfigService) {
        const user = config.get<string>('SMTP_USER');
        this.transporter = nodemailer.createTransport({
            host: config.get<string>('SMTP_HOST', 'localhost'),
            port: Number(config.get('SMTP_PORT', 1025)),
            secure: config.get<string>('SMTP_SECURE') === 'true',
            auth: user ? { user, pass: config.get<string>('SMTP_PASS', '') } : undefined,
        });
        this.from = config.get<string>('MAIL_FROM', 'Healthcare Clinic <no-reply@clinic.local>');
    }

    async send(to: string, subject: string, text: string): Promise<void> {
        await this.transporter.sendMail({ from: this.from, to, subject, text });
    }
}