import { CustomersResolver } from './customers/customers.resolver';
import { DoctorsResolver } from './doctors/doctors.resolver';
import { SchedulesResolver } from './schedules/schedules.resolver';

const serviceMock = () => ({
    create: jest.fn().mockResolvedValue('ok'),
    update: jest.fn().mockResolvedValue('ok'),
    findAll: jest.fn().mockResolvedValue('ok'),
    findOne: jest.fn().mockResolvedValue('ok'),
    remove: jest.fn().mockResolvedValue('ok'),
});

describe('Resolvers delegate to their services', () => {
    const page = { page: 1, limit: 10 };

    it('CustomersResolver', async () => {
        const s = serviceMock();
        const r = new CustomersResolver(s as never);
        const input = { name: 'Budi', email: 'budi@example.com' };

        await r.createCustomer(input);
        await r.updateCustomer('id', { name: 'X' });
        await r.customers(page);
        await r.customer('id');
        await r.deleteCustomer('id');

        expect(s.create).toHaveBeenCalledWith(input);
        expect(s.update).toHaveBeenCalledWith('id', { name: 'X' });
        expect(s.findAll).toHaveBeenCalledWith(page);
        expect(s.findOne).toHaveBeenCalledWith('id');
        expect(s.remove).toHaveBeenCalledWith('id');
    });

    it('DoctorsResolver', async () => {
        const s = serviceMock();
        const r = new DoctorsResolver(s as never);

        await r.createDoctor({ name: 'dr. Sari' });
        await r.updateDoctor('id', { name: 'X' });
        await r.doctors(page);
        await r.doctor('id');
        await r.deleteDoctor('id');

        expect(s.create).toHaveBeenCalledWith({ name: 'dr. Sari' });
        expect(s.update).toHaveBeenCalledWith('id', { name: 'X' });
        expect(s.findAll).toHaveBeenCalledWith(page);
        expect(s.findOne).toHaveBeenCalledWith('id');
        expect(s.remove).toHaveBeenCalledWith('id');
    });

    it('SchedulesResolver', async () => {
        const s = serviceMock();
        const r = new SchedulesResolver(s as never);
        const input = {
            objective: 'Checkup',
            customerId: 'c',
            doctorId: 'd',
            scheduledAt: new Date(),
        };

        await r.createSchedule(input);
        await r.schedules(page);
        await r.schedule('id');
        await r.deleteSchedule('id');

        expect(s.create).toHaveBeenCalledWith(input);
        expect(s.findAll).toHaveBeenCalledWith(page);
        expect(s.findOne).toHaveBeenCalledWith('id');
        expect(s.remove).toHaveBeenCalledWith('id');
    });
});