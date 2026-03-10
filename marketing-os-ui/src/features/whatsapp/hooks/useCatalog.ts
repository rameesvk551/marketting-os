import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { whatsappApi } from '../api/whatsappApi';

export function useCatalog() {
    // Commerce settings
    const [commerceSettings, setCommerceSettings] = useState<{ is_cart_enabled: boolean; is_catalog_visible: boolean } | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Catalog products & categories
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // Sending states
    const [sending, setSending] = useState(false);

    const fetchCommerceSettings = useCallback(async () => {
        setSettingsLoading(true);
        try {
            const res = await whatsappApi.getCommerceSettings();
            setCommerceSettings(res.data);
        } catch {
            // Settings may not be configured yet
            setCommerceSettings({ is_cart_enabled: true, is_catalog_visible: false });
        } finally {
            setSettingsLoading(false);
        }
    }, []);

    const updateCommerceSettings = useCallback(async (settings: { isCartEnabled?: boolean; isCatalogVisible?: boolean }) => {
        setSettingsLoading(true);
        try {
            await whatsappApi.updateCommerceSettings(settings);
            message.success('Commerce settings updated');
            await fetchCommerceSettings();
        } catch {
            message.error('Failed to update commerce settings');
        } finally {
            setSettingsLoading(false);
        }
    }, [fetchCommerceSettings]);

    const fetchProducts = useCallback(async (filters?: any) => {
        setProductsLoading(true);
        try {
            const res = await whatsappApi.getCatalogProducts(filters);
            setProducts(res.data?.data || res.data || []);
        } catch {
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await whatsappApi.getCatalogCategories();
            setCategories(res.data || []);
        } catch {
            setCategories([]);
        }
    }, []);

    // ── Catalog template operations ──
    const createCatalogTemplate = useCallback(async (template: { name: string; language: string; bodyText: string; bodyExamples?: string[]; footerText?: string }) => {
        setSending(true);
        try {
            const res = await whatsappApi.createCatalogTemplate(template);
            message.success('Catalog template created and submitted for approval');
            return res.data;
        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to create catalog template');
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    const sendCatalogTemplate = useCallback(async (payload: { recipientPhone: string; templateName: string; language: string; bodyParams?: Array<{ type: string; text: string }>; thumbnailProductRetailerId?: string }) => {
        setSending(true);
        try {
            const res = await whatsappApi.sendCatalogTemplate(payload);
            message.success('Catalog template message sent');
            return res.data;
        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to send catalog template');
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    // ── Interactive catalog message ──
    const sendCatalogMessage = useCallback(async (payload: { recipientPhone: string; bodyText: string; footerText?: string; thumbnailProductRetailerId?: string }) => {
        setSending(true);
        try {
            const res = await whatsappApi.sendCatalogMessage(payload);
            message.success('Catalog message sent');
            return res.data;
        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to send catalog message');
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    // ── Single product message ──
    const sendSingleProduct = useCallback(async (payload: { recipientPhone: string; catalogId: string; productRetailerId: string; bodyText?: string; footerText?: string }) => {
        setSending(true);
        try {
            const res = await whatsappApi.sendSingleProduct(payload);
            message.success('Product message sent');
            return res.data;
        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to send product message');
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    // ── Multi product message ──
    const sendMultiProduct = useCallback(async (payload: { recipientPhone: string; catalogId: string; headerText: string; bodyText: string; footerText?: string; sections: Array<{ title: string; productRetailerIds: string[] }> }) => {
        setSending(true);
        try {
            const res = await whatsappApi.sendMultiProduct(payload);
            message.success('Multi-product message sent');
            return res.data;
        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to send multi-product message');
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    // ── Auto-build from categories ──
    const sendProductsByCategories = useCallback(async (payload: { recipientPhone: string; catalogId: string; headerText?: string; bodyText?: string; footerText?: string }) => {
        setSending(true);
        try {
            const res = await whatsappApi.sendProductsByCategories(payload);
            message.success('Multi-product message sent (auto-built from categories)');
            return res.data;
        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to send');
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    useEffect(() => {
        fetchCommerceSettings();
        fetchProducts();
        fetchCategories();
    }, [fetchCommerceSettings, fetchProducts, fetchCategories]);

    return {
        // Commerce settings
        commerceSettings, settingsLoading,
        fetchCommerceSettings, updateCommerceSettings,
        // Products & categories
        products, categories, productsLoading,
        fetchProducts, fetchCategories,
        // Catalog operations
        sending,
        createCatalogTemplate, sendCatalogTemplate,
        sendCatalogMessage, sendSingleProduct,
        sendMultiProduct, sendProductsByCategories,
    };
}
