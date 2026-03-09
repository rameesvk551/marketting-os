// presentation/controllers/whatsapp/CatalogMessageController.ts
// HTTP handlers for WhatsApp catalog templates, catalog/product/multi-product
// messages, and commerce settings.

import { Request, Response, NextFunction } from 'express';

export function createCatalogMessageController(catalogService: any) {

    // ═══════════════════════════════════════
    // CATALOG TEMPLATE CREATION
    // ═══════════════════════════════════════

    /** POST /catalog-templates — create a catalog template on Meta */
    const createCatalogTemplate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { name, language, bodyText, bodyExamples, footerText } = req.body;

            if (!name || !bodyText) {
                res.status(400).json({ error: 'name and bodyText are required' });
                return;
            }

            if (bodyText.length > 1024) {
                res.status(400).json({ error: 'bodyText cannot exceed 1024 characters' });
                return;
            }

            if (footerText && footerText.length > 60) {
                res.status(400).json({ error: 'footerText cannot exceed 60 characters' });
                return;
            }

            if (name.length > 512) {
                res.status(400).json({ error: 'Template name cannot exceed 512 characters' });
                return;
            }

            const result = await catalogService.createCatalogTemplate(tenantId, {
                name,
                language: language || 'en_US',
                bodyText,
                bodyExamples,
                footerText,
            });

            res.status(201).json({
                data: result,
                message: 'Catalog template created and submitted to Meta for review',
            });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // SEND CATALOG TEMPLATE MESSAGE
    // ═══════════════════════════════════════

    /** POST /catalog-templates/send — send an approved catalog template */
    const sendCatalogTemplate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { recipientPhone, templateName, language, bodyParams, thumbnailProductRetailerId } = req.body;

            if (!recipientPhone || !templateName) {
                res.status(400).json({ error: 'recipientPhone and templateName are required' });
                return;
            }

            const result = await catalogService.sendCatalogTemplate(tenantId, {
                recipientPhone,
                templateName,
                language: language || 'en_US',
                bodyParams,
                thumbnailProductRetailerId,
            });

            res.json({ data: result, message: 'Catalog template message sent' });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // SEND CATALOG MESSAGE (interactive, whole catalog)
    // ═══════════════════════════════════════

    /** POST /catalog-messages/send — send interactive catalog message */
    const sendCatalogMessage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { recipientPhone, bodyText, footerText, thumbnailProductRetailerId } = req.body;

            if (!recipientPhone || !bodyText) {
                res.status(400).json({ error: 'recipientPhone and bodyText are required' });
                return;
            }

            const result = await catalogService.sendCatalogMessage(tenantId, {
                recipientPhone,
                bodyText,
                footerText,
                thumbnailProductRetailerId,
            });

            res.json({ data: result, message: 'Catalog message sent' });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // SEND SINGLE-PRODUCT MESSAGE
    // ═══════════════════════════════════════

    /** POST /catalog-messages/send-product — send single product message */
    const sendSingleProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { recipientPhone, catalogId, productRetailerId, bodyText, footerText } = req.body;

            if (!recipientPhone || !catalogId || !productRetailerId) {
                res.status(400).json({ error: 'recipientPhone, catalogId, and productRetailerId are required' });
                return;
            }

            const result = await catalogService.sendSingleProduct(tenantId, {
                recipientPhone,
                catalogId,
                productRetailerId,
                bodyText,
                footerText,
            });

            res.json({ data: result, message: 'Single product message sent' });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // SEND MULTI-PRODUCT MESSAGE
    // ═══════════════════════════════════════

    /** POST /catalog-messages/send-products — send multi-product message */
    const sendMultiProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { recipientPhone, catalogId, headerText, bodyText, footerText, sections } = req.body;

            if (!recipientPhone || !catalogId || !headerText || !bodyText || !sections || !sections.length) {
                res.status(400).json({ error: 'recipientPhone, catalogId, headerText, bodyText, and sections are required' });
                return;
            }

            // Validate sections structure
            for (const section of sections) {
                if (!section.title || !section.productRetailerIds || !section.productRetailerIds.length) {
                    res.status(400).json({ error: 'Each section needs a title and at least one productRetailerId' });
                    return;
                }
            }

            const result = await catalogService.sendMultiProduct(tenantId, {
                recipientPhone,
                catalogId,
                headerText,
                bodyText,
                footerText,
                sections,
            });

            res.json({ data: result, message: 'Multi-product message sent' });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // AUTO-BUILD MULTI-PRODUCT FROM CATEGORIES
    // ═══════════════════════════════════════

    /** POST /catalog-messages/send-by-categories — auto-build sections from categories & send */
    const sendProductsByCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { recipientPhone, catalogId, headerText, bodyText, footerText } = req.body;

            if (!recipientPhone || !catalogId) {
                res.status(400).json({ error: 'recipientPhone and catalogId are required' });
                return;
            }

            const { sections } = await catalogService.buildSectionsFromCategories(tenantId, catalogId);

            if (!sections.length) {
                res.status(400).json({ error: 'No active products with categories found to build sections' });
                return;
            }

            const result = await catalogService.sendMultiProduct(tenantId, {
                recipientPhone,
                catalogId,
                headerText: headerText || 'Our Products',
                bodyText: bodyText || 'Browse our collection',
                footerText,
                sections,
            });

            res.json({ data: result, message: 'Multi-product message sent (auto-built from categories)' });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // COMMERCE SETTINGS
    // ═══════════════════════════════════════

    /** GET /commerce-settings — get cart & catalog visibility settings */
    const getCommerceSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const settings = await catalogService.getCommerceSettings(tenantId);
            res.json({ data: settings });
        } catch (error) { next(error); }
    };

    /** PUT /commerce-settings — enable/disable cart and catalog */
    const updateCommerceSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { isCartEnabled, isCatalogVisible } = req.body;

            if (isCartEnabled === undefined && isCatalogVisible === undefined) {
                res.status(400).json({ error: 'Provide isCartEnabled and/or isCatalogVisible' });
                return;
            }

            const result = await catalogService.updateCommerceSettings(tenantId, {
                isCartEnabled,
                isCatalogVisible,
            });

            res.json({ data: result, message: 'Commerce settings updated' });
        } catch (error) { next(error); }
    };

    // ═══════════════════════════════════════
    // PRODUCT HELPERS (lists for UI)
    // ═══════════════════════════════════════

    /** GET /catalog-products — list products available for catalog messages */
    const listCatalogProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { search, category, page, limit } = req.query;
            const products = await catalogService.getProductsForCatalog(tenantId, {
                status: 'active',
                search,
                category,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 50,
            });

            res.json({ data: products });
        } catch (error) { next(error); }
    };

    /** GET /catalog-categories — list categories for building sections */
    const listCatalogCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const categories = await catalogService.getCategoriesForCatalog(tenantId);
            res.json({ data: categories });
        } catch (error) { next(error); }
    };

    /** GET /catalog-sections/preview — preview auto-built sections from categories */
    const previewSections = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const catalogId = req.query.catalogId as string || '';
            const sections = await catalogService.buildSectionsFromCategories(tenantId, catalogId);
            res.json({ data: sections });
        } catch (error) { next(error); }
    };

    return {
        createCatalogTemplate,
        sendCatalogTemplate,
        sendCatalogMessage,
        sendSingleProduct,
        sendMultiProduct,
        sendProductsByCategories,
        getCommerceSettings,
        updateCommerceSettings,
        listCatalogProducts,
        listCatalogCategories,
        previewSections,
    };
}
