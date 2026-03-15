import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as partnerController from './partner.controller.js';

export const createPartnerRouter = () => {
    const router = Router();

    router.use(authMiddleware());
    router.get('/dashboard', partnerController.getDashboard);
    router.get('/customers', partnerController.getCustomers);
    router.get('/commissions', partnerController.getCommissions);
    router.post('/withdraw', partnerController.withdraw);

    return router;
};
