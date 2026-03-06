// features/catalog/services/catalogService.ts
// Domain service wrapping catalog API calls.

import { catalogApi } from '../api/catalogApi';

export const catalogService = {
    getConfig: () => catalogApi.getConfig(),
    connect: (payload: { catalogId: string; businessId: string; catalogName?: string; accessToken: string }) =>
        catalogApi.connect(payload),
    disconnect: (configId: string) => catalogApi.disconnect(configId),
    listCatalogs: (businessId: string, accessToken: string) =>
        catalogApi.listCatalogs(businessId, accessToken),
    syncAll: () => catalogApi.syncAll(),
    syncProduct: (productId: string) => catalogApi.syncProduct(productId),
    getSyncLogs: (limit?: number) => catalogApi.getSyncLogs(limit),
    getProducts: () => catalogApi.getProducts(),
};
