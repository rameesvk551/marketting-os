import { Router } from 'express';
import { createContactController } from './controllers/ContactController.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../../middlewares/tenant.middleware.js';
import multer from 'multer';

// Use memory storage for fast CSV parsing
const upload = multer({ storage: multer.memoryStorage() });

export function createRouter() {
    const router = Router();
    const contactController = createContactController();

    router.use(authMiddleware());
    router.use(tenantMiddleware);

    router.get('/', contactController.list);
    router.post('/import/csv', upload.single('file'), contactController.importCsv);

    return router;
}
