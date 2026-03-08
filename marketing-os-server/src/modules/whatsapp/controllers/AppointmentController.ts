import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/AppointmentService.js';

export function createAppointmentController(appointmentService: AppointmentService) {
    const getAppointments = async (req: any, res: any, next: NextFunction) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const appointments = await appointmentService.getAppointments(tenantId);
            res.json({ data: appointments });
        } catch (error) { next(error); }
    };

    const createAppointment = async (req: any, res: any, next: NextFunction) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const appointment = await appointmentService.createAppointment(tenantId, req.body);
            res.status(201).json({ data: appointment });
        } catch (error) { next(error); }
    };

    const updateStatus = async (req: any, res: any, next: NextFunction) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            const { status } = req.body;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const updated = await appointmentService.updateStatus(id, tenantId, status);
            res.json({ data: updated });
        } catch (error) { next(error); }
    };

    return {
        getAppointments,
        createAppointment,
        updateStatus
    };
}
