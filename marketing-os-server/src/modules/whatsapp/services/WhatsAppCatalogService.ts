// application/services/whatsapp/WhatsAppCatalogService.ts
// Handles WhatsApp catalog template creation, sending catalog/product/multi-product
// messages, and commerce settings via Meta Graph API.

const GRAPH_API_BASE = 'https://graph.facebook.com';

export interface CatalogTemplateInput {
    name: string;
    language: string;
    bodyText: string;
    bodyExamples?: string[];
    footerText?: string;
}

export interface SendCatalogTemplateInput {
    recipientPhone: string;
    templateName: string;
    language: string;
    bodyParams?: Array<{ type: string; text: string }>;
    thumbnailProductRetailerId?: string;
}

export interface SendCatalogMessageInput {
    recipientPhone: string;
    bodyText: string;
    footerText?: string;
    thumbnailProductRetailerId?: string;
}

export interface SendSingleProductInput {
    recipientPhone: string;
    catalogId: string;
    productRetailerId: string;
    bodyText?: string;
    footerText?: string;
}

export interface SendMultiProductInput {
    recipientPhone: string;
    catalogId: string;
    headerText: string;
    bodyText: string;
    footerText?: string;
    sections: Array<{
        title: string;
        productRetailerIds: string[];
    }>;
}

export interface CommerceSettings {
    isCartEnabled?: boolean;
    isCatalogVisible?: boolean;
}

export function createWhatsAppCatalogService(
    providerFactory: any,
    messageService: any,
    productService: any,
    categoryService: any,
    apiVersion: string = 'v21.0',
) {

    // ── Helper: get tenant credentials ──
    async function getCredentials(tenantId: string) {
        const creds = await providerFactory.getCredentialsForTenant(tenantId);
        if (!creds) {
            throw Object.assign(
                new Error('WhatsApp credentials not configured. Connect WhatsApp in Settings first.'),
                { statusCode: 400 },
            );
        }
        return creds;
    }

    // ═══════════════════════════════════════
    // CATALOG TEMPLATE CREATION (on Meta)
    // ═══════════════════════════════════════

    async function createCatalogTemplate(
        tenantId: string,
        input: CatalogTemplateInput,
    ): Promise<{ id: string; status: string; category: string }> {
        const creds = await getCredentials(tenantId);
        const url = `${GRAPH_API_BASE}/${apiVersion}/${creds.wabaId}/message_templates`;

        const components: any[] = [
            {
                type: 'BODY',
                text: input.bodyText,
                ...(input.bodyExamples && input.bodyExamples.length > 0
                    ? { example: { body_text: [input.bodyExamples] } }
                    : {}),
            },
            {
                type: 'BUTTONS',
                buttons: [{ type: 'CATALOG', text: 'View catalog' }],
            },
        ];

        if (input.footerText) {
            components.splice(1, 0, { type: 'FOOTER', text: input.footerText });
        }

        const body = {
            name: input.name,
            language: input.language || 'en_US',
            category: 'MARKETING',
            components,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = (await response.json()) as any;

        if (data.error) {
            throw Object.assign(
                new Error(data.error.error_user_msg || data.error.message || 'Failed to create catalog template on Meta'),
                { statusCode: 400, metaError: data.error },
            );
        }

        return { id: data.id, status: data.status || 'PENDING', category: data.category || 'MARKETING' };
    }

    // ═══════════════════════════════════════
    // SEND CATALOG TEMPLATE MESSAGE
    // ═══════════════════════════════════════

    async function sendCatalogTemplate(
        tenantId: string,
        input: SendCatalogTemplateInput,
    ): Promise<{ messageId: string; waMessageId: string }> {
        const creds = await getCredentials(tenantId);
        const url = `${GRAPH_API_BASE}/${apiVersion}/${creds.phoneNumberId}/messages`;

        const components: any[] = [];

        // Body parameters (template variables)
        if (input.bodyParams && input.bodyParams.length > 0) {
            components.push({
                type: 'body',
                parameters: input.bodyParams.map(p => ({ type: p.type || 'text', text: p.text })),
            });
        }

        // Catalog button with optional thumbnail
        const buttonParams: any = {
            type: 'button',
            sub_type: 'CATALOG',
            index: 0,
        };

        if (input.thumbnailProductRetailerId) {
            buttonParams.parameters = [
                {
                    type: 'action',
                    action: {
                        thumbnail_product_retailer_id: input.thumbnailProductRetailerId,
                    },
                },
            ];
        }

        components.push(buttonParams);

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: input.recipientPhone,
            type: 'template',
            template: {
                name: input.templateName,
                language: { code: input.language || 'en_US' },
                components,
            },
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${creds.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = (await response.json()) as any;

        if (data.error) {
            throw Object.assign(
                new Error(data.error.error_user_msg || data.error.message || 'Failed to send catalog template'),
                { statusCode: 400, metaError: data.error },
            );
        }

        const waMessageId = data.messages?.[0]?.id || '';

        return { messageId: waMessageId, waMessageId };
    }

    // ═══════════════════════════════════════
    // SEND CATALOG MESSAGE (interactive)
    // Uses messageService.sendInteractive which handles
    // Meta API send + local DB record + socket events.
    // ═══════════════════════════════════════

    async function sendCatalogMessage(
        tenantId: string,
        input: SendCatalogMessageInput,
    ): Promise<{ success: boolean; messageId: string; providerMessageId: string }> {
        const result = await messageService.sendInteractive({
            tenantId,
            recipientPhone: input.recipientPhone,
            interactiveContent: {
                type: 'CATALOG_MESSAGE',
                body: input.bodyText,
                footer: input.footerText,
                action: {
                    ...(input.thumbnailProductRetailerId
                        ? { thumbnail_product_retailer_id: input.thumbnailProductRetailerId }
                        : {}),
                },
            },
            senderUserId: 'system',
        });

        return { success: result.success, messageId: result.messageId, providerMessageId: result.providerMessageId };
    }

    // ═══════════════════════════════════════
    // SEND SINGLE-PRODUCT MESSAGE
    // ═══════════════════════════════════════

    async function sendSingleProduct(
        tenantId: string,
        input: SendSingleProductInput,
    ): Promise<{ success: boolean; messageId: string; providerMessageId: string }> {
        const result = await messageService.sendInteractive({
            tenantId,
            recipientPhone: input.recipientPhone,
            interactiveContent: {
                type: 'PRODUCT',
                body: input.bodyText || 'Check out this product',
                footer: input.footerText,
                action: {
                    catalog_id: input.catalogId,
                    product_retailer_id: input.productRetailerId,
                },
            },
            senderUserId: 'system',
        });

        return { success: result.success, messageId: result.messageId, providerMessageId: result.providerMessageId };
    }

    // ═══════════════════════════════════════
    // SEND MULTI-PRODUCT MESSAGE
    // ═══════════════════════════════════════

    async function sendMultiProduct(
        tenantId: string,
        input: SendMultiProductInput,
    ): Promise<{ success: boolean; messageId: string; providerMessageId: string }> {
        const sections = input.sections.map(section => ({
            title: section.title,
            product_items: section.productRetailerIds.map(id => ({ product_retailer_id: id })),
        }));

        const result = await messageService.sendInteractive({
            tenantId,
            recipientPhone: input.recipientPhone,
            interactiveContent: {
                type: 'PRODUCT_LIST',
                header: input.headerText,
                body: input.bodyText,
                footer: input.footerText,
                action: {
                    catalog_id: input.catalogId,
                    sections,
                },
            },
            senderUserId: 'system',
        });

        return { success: result.success, messageId: result.messageId, providerMessageId: result.providerMessageId };
    }

    // ═══════════════════════════════════════
    // COMMERCE SETTINGS
    // ═══════════════════════════════════════

    async function getCommerceSettings(tenantId: string) {
        const creds = await getCredentials(tenantId);
        const url = `${GRAPH_API_BASE}/${apiVersion}/${creds.phoneNumberId}/whatsapp_commerce_settings`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${creds.accessToken}` },
        });

        const data = (await response.json()) as any;

        if (data.error) {
            throw Object.assign(
                new Error(data.error.message || 'Failed to get commerce settings'),
                { statusCode: 400, metaError: data.error },
            );
        }

        return data.data?.[0] || { is_cart_enabled: true, is_catalog_visible: false };
    }

    async function updateCommerceSettings(tenantId: string, settings: CommerceSettings) {
        const creds = await getCredentials(tenantId);

        const params = new URLSearchParams();
        if (settings.isCartEnabled !== undefined) {
            params.set('is_cart_enabled', String(settings.isCartEnabled));
        }
        if (settings.isCatalogVisible !== undefined) {
            params.set('is_catalog_visible', String(settings.isCatalogVisible));
        }

        const url = `${GRAPH_API_BASE}/${apiVersion}/${creds.phoneNumberId}/whatsapp_commerce_settings?${params.toString()}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${creds.accessToken}` },
        });

        const data = (await response.json()) as any;

        if (data.error) {
            throw Object.assign(
                new Error(data.error.message || 'Failed to update commerce settings'),
                { statusCode: 400, metaError: data.error },
            );
        }

        return { success: data.success === true };
    }

    // ═══════════════════════════════════════
    // PRODUCT HELPERS (use existing products)
    // ═══════════════════════════════════════

    async function getProductsForCatalog(tenantId: string, query?: any) {
        return productService.getAllProducts(tenantId, query || { status: 'active', limit: 100 });
    }

    async function getCategoriesForCatalog(tenantId: string) {
        return categoryService.getAllCategories(tenantId);
    }

    /**
     * Build multi-product sections automatically from categories.
     * Groups active products by category for use in multi-product messages.
     */
    async function buildSectionsFromCategories(
        tenantId: string,
        catalogId: string,
        maxSections: number = 10,
        maxItemsPerSection: number = 30,
    ) {
        const categories = await categoryService.getAllCategories(tenantId);
        const { data: products } = await productService.getAllProducts(tenantId, { status: 'active', limit: 500 });

        const categoryMap = new Map<string, { name: string; products: any[] }>();

        for (const cat of categories) {
            categoryMap.set((cat as any)._id.toString(), { name: (cat as any).name || (cat as any).categoryName, products: [] });
        }

        for (const prod of products) {
            const catId = prod.category?.toString();
            if (catId && categoryMap.has(catId)) {
                categoryMap.get(catId)!.products.push(prod);
            }
        }

        const sections: Array<{ title: string; productRetailerIds: string[] }> = [];

        for (const [, value] of categoryMap) {
            if (value.products.length === 0) continue;
            if (sections.length >= maxSections) break;

            sections.push({
                title: value.name,
                productRetailerIds: value.products
                    .slice(0, maxItemsPerSection)
                    .map((p: any) => p.sku || p._id.toString()),
            });
        }

        return { catalogId, sections };
    }

    return {
        // Template
        createCatalogTemplate,
        sendCatalogTemplate,
        // Interactive messages
        sendCatalogMessage,
        sendSingleProduct,
        sendMultiProduct,
        // Commerce settings
        getCommerceSettings,
        updateCommerceSettings,
        // Product helpers
        getProductsForCatalog,
        getCategoriesForCatalog,
        buildSectionsFromCategories,
    };
}
