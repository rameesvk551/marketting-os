// providers/MetaCatalogApiProvider.ts
// Wraps all Meta Graph API calls for Catalog operations.

import { logger } from '../../../config/logger.js';

export interface CatalogApiConfig {
    accessToken: string;
    apiVersion: string;
}

export interface BatchRequest {
    method: 'CREATE' | 'UPDATE' | 'DELETE';
    data: Record<string, any>;
}

export interface BatchResponse {
    handles: string[];
}

export interface BatchStatusResponse {
    data: Array<{
        handle: string;
        status: string;
        errors_total_count: number;
        errors?: Array<{ message: string }>;
    }>;
}

export interface MetaCatalogInfo {
    id: string;
    name: string;
    product_count?: number;
    vertical?: string;
}

export interface MetaProductItem {
    id: string;
    retailer_id: string;
    name: string;
    price: string;
    availability: string;
    image_url: string;
    url: string;
    description?: string;
    brand?: string;
}

export interface ProductSetData {
    name: string;
    filter?: Record<string, any>;
    metadata?: {
        cover_image_url?: string;
        external_url?: string;
        description?: string;
    };
}

export interface IMetaCatalogApiProvider {
    getCatalogs(businessId: string): Promise<MetaCatalogInfo[]>;
    getCatalog(catalogId: string): Promise<MetaCatalogInfo>;
    createCatalog(businessId: string, name: string): Promise<MetaCatalogInfo>;
    getProducts(catalogId: string, limit?: number): Promise<MetaProductItem[]>;
    batchProducts(catalogId: string, requests: BatchRequest[]): Promise<BatchResponse>;
    checkBatchStatus(catalogId: string, handle: string): Promise<BatchStatusResponse>;
    createProductSet(catalogId: string, data: ProductSetData): Promise<{ id: string }>;
    getProductSets(catalogId: string): Promise<any[]>;
}

const GRAPH_API_BASE = 'https://graph.facebook.com';

export function createMetaCatalogApiProvider(config: CatalogApiConfig): IMetaCatalogApiProvider {
    const { accessToken, apiVersion } = config;
    const baseUrl = `${GRAPH_API_BASE}/${apiVersion}`;

    async function graphFetch(url: string, options: RequestInit = {}): Promise<any> {
        const separator = url.includes('?') ? '&' : '?';
        const fullUrl = `${url}${separator}access_token=${accessToken}`;

        logger.debug(`[Catalog API] ${options.method || 'GET'} ${url}`);

        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data: any = await response.json();

        if (!response.ok) {
            const errorMsg = data?.error?.message || `HTTP ${response.status}`;
            const errorCode = data?.error?.code || response.status;
            logger.error(`[Catalog API] Error ${errorCode}: ${errorMsg}`);
            throw new Error(`Meta Catalog API Error (${errorCode}): ${errorMsg}`);
        }

        return data;
    }

    return {
        async getCatalogs(businessId: string): Promise<MetaCatalogInfo[]> {
            const data = await graphFetch(
                `${baseUrl}/${businessId}/owned_product_catalogs?fields=id,name,product_count,vertical`,
            );
            return data.data || [];
        },

        async getCatalog(catalogId: string): Promise<MetaCatalogInfo> {
            return graphFetch(
                `${baseUrl}/${catalogId}?fields=id,name,product_count,vertical`,
            );
        },

        async createCatalog(businessId: string, name: string): Promise<MetaCatalogInfo> {
            const data = await graphFetch(
                `${baseUrl}/${businessId}/owned_product_catalogs`,
                {
                    method: 'POST',
                    body: JSON.stringify({ name }),
                },
            );
            return data;
        },

        async getProducts(catalogId: string, limit = 50): Promise<MetaProductItem[]> {
            const data = await graphFetch(
                `${baseUrl}/${catalogId}/products?fields=id,retailer_id,name,price,availability,image_url,url,description,brand&limit=${limit}`,
            );
            return data.data || [];
        },

        async batchProducts(catalogId: string, requests: BatchRequest[]): Promise<BatchResponse> {
            const data = await graphFetch(
                `${baseUrl}/${catalogId}/items_batch`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        item_type: 'PRODUCT_ITEM',
                        requests,
                    }),
                },
            );
            return data;
        },

        async checkBatchStatus(catalogId: string, handle: string): Promise<BatchStatusResponse> {
            return graphFetch(
                `${baseUrl}/${catalogId}/check_batch_request_status?handle=${handle}`,
            );
        },

        async createProductSet(catalogId: string, data: ProductSetData): Promise<{ id: string }> {
            return graphFetch(
                `${baseUrl}/${catalogId}/product_sets`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                },
            );
        },

        async getProductSets(catalogId: string): Promise<any[]> {
            const data = await graphFetch(
                `${baseUrl}/${catalogId}/product_sets?fields=id,name,product_count`,
            );
            return data.data || [];
        },
    };
}
