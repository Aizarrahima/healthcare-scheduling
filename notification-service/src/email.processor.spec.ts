import { EmailProcessor } from './email.processor';

describe('EmailProcessor', () => {
    const mailer = { send: jest.fn().mockResolvedValue(undefined) };
    const processor = new EmailProcessor(mailer as never);
    const job = {
        id: '1',
        name: 'schedule-created',
        attemptsMade: 1,
        data: {
            scheduleId: 's1',
            customerEmail: 'budi@example.com',
            customerName: 'Budi',
            doctorName: 'dr. Sari',
            objective: 'Checkup',
            scheduledAt: '2026-10-10T03:00:00.000Z',
        },
    };

    beforeEach(() => jest.clearAllMocks());

    it('sends a confirmation email on create', async () => {
        await processor.handleCreated(job as never);
        const [to, subject, text] = mailer.send.mock.calls[0];
        expect(to).toBe('budi@example.com');
        expect(subject).toMatch(/Konfirmasi/);
        expect(text).toContain('dr. Sari');
        expect(text).toContain('WIB');
    });

    it('sends a cancellation email on delete', async () => {
        await processor.handleDeleted(job as never);
        expect(mailer.send.mock.calls[0][1]).toMatch(/Pembatalan/);
    });

    it('propagates mailer errors so Bull can retry the job', async () => {
        mailer.send.mockRejectedValueOnce(new Error('SMTP down'));
        await expect(processor.handleCreated(job as never)).rejects.toThrow('SMTP down');
    });

    it('logs failed jobs without throwing', () => {
        expect(() => processor.onFailed(job as never, new Error('boom'))).not.toThrow();
    });
});