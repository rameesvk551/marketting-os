// AppointmentService.ts
export class AppointmentService {
    constructor(private appointmentRepo: any) { }

    async createAppointment(tenantId: string, data: { contactName: string, contactPhone: string, serviceType: string, appointmentDate: Date }) {
        return await this.appointmentRepo.create({
            tenant_id: tenantId,
            contact_name: data.contactName,
            contact_phone: data.contactPhone,
            service_type: data.serviceType,
            appointment_date: data.appointmentDate,
            status: 'SCHEDULED',
        });
    }

    async getAppointments(tenantId: string) {
        return await this.appointmentRepo.findAll({
            where: { tenant_id: tenantId },
            order: [['appointment_date', 'ASC']]
        });
    }

    async updateStatus(id: string, tenantId: string, status: string) {
        const appointment = await this.appointmentRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!appointment) throw new Error('Appointment not found');

        appointment.status = status;
        await appointment.save();
        return appointment;
    }
}
