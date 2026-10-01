const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

import * as nodemailer from 'nodemailer';
import { MailerService } from './mailer.service';

describe('MailerService', () => {
    const env: Record<string, string> = {
        SMTP_HOST: 'mailpit',
        SMTP_PORT: '1025',
        MAIL_FROM: 'Clinic <no-reply@clinic.local>',
    };
    const config = { get: jest.fn((key: string, fallback?: string) => env[key] ?? fallback) };

    beforeEach(() => jest.clearAllMocks());

    it('builds an SMTP transport without auth when no credentials are set', () => {
        new MailerService(config as never);
        expect(nodemailer.createTransport).toHaveBeenCalledWith(
            expect.objectContaining({ host: 'mailpit', port: 1025, secure: false, auth: undefined }),
        );
    });

    it('sends mail with the configured sender', async () => {
        const mailer = new MailerService(config as never);
        await mailer.send('budi@example.com', 'Subject', 'Body');
        expect(mockSendMail).toHaveBeenCalledWith({
            from: 'Clinic <no-reply@clinic.local>',
            to: 'budi@example.com',
            subject: 'Subject',
            text: 'Body',
        });
    });
});