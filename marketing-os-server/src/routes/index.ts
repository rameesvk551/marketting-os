import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { createRouter as createWhatsAppRouter } from '../modules/whatsapp/whatsapp.router.js';
import { createRouter as createInstagramRouter } from '../modules/instagram/instagram.router.js';
import { createRouter as createSettingsRouter } from '../modules/settings/settings.router.js';
import { createStoreRouter } from '../modules/store/store.router.js';
import { createRouter as createCatalogRouter } from '../modules/catalog/catalog.router.js';
import { createRouter as createContactRouter } from '../modules/contacts/contacts.router.js';
import { createOrderRouter } from '../modules/orders/order.routes.js';
import { createProductRouter } from '../modules/products/product.routes.js';
import { createPartnerRouter } from '../modules/partner/partner.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/whatsapp', createWhatsAppRouter());
router.use('/instagram', createInstagramRouter());
router.use('/catalog', createCatalogRouter());
router.use('/settings', createSettingsRouter());
router.use('/store', createStoreRouter());
router.use('/contacts', createContactRouter());
router.use('/partner', createPartnerRouter());

export default router;
