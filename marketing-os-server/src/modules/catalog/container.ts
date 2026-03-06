// container.ts
// Dependency injection container for the Catalog module.
// Same architecture as Instagram container — all dependencies wired here.

import { Pool } from 'pg';
import { getConfig } from '../../config/index.js';

// Repositories
import { createCatalogConfigRepo, type ICatalogConfigRepo } from './repositories/CatalogConfigRepo.js';
import { createCatalogSyncLogRepo, type ICatalogSyncLogRepo } from './repositories/CatalogSyncLogRepo.js';

// Provider
import { createMetaCatalogApiProvider, type IMetaCatalogApiProvider } from './providers/MetaCatalogApiProvider.js';

// Services
import { createMetaCatalogService, type IMetaCatalogService } from './services/MetaCatalogService.js';

// Controllers
import { createCatalogController } from './controllers/CatalogController.js';

/**
 * Catalog container - holds all catalog-related dependencies
 */
export interface CatalogContainer {
    // Repositories
    configRepo: ICatalogConfigRepo;
    syncLogRepo: ICatalogSyncLogRepo;

    // Services
    catalogService: IMetaCatalogService;

    // Controllers
    catalogController: ReturnType<typeof createCatalogController>;

    // Provider factory
    createProvider: (accessToken: string, apiVersion: string) => IMetaCatalogApiProvider;
}

/**
 * Create Catalog container with all dependencies
 */
export function createCatalogContainer(pool: Pool): CatalogContainer {
    const config = getConfig();
    const apiVersion = config.whatsapp?.meta?.apiVersion || 'v21.0';

    // ── Repositories ──
    const configRepo = createCatalogConfigRepo(pool);
    const syncLogRepo = createCatalogSyncLogRepo(pool);

    // ── Provider factory (per-request, since each tenant has their own token) ──
    const createProvider = (accessToken: string, version?: string): IMetaCatalogApiProvider => {
        return createMetaCatalogApiProvider({
            accessToken,
            apiVersion: version || apiVersion,
        });
    };

    // ── Services ──
    const catalogService = createMetaCatalogService(
        configRepo,
        syncLogRepo,
        createProvider,
        apiVersion,
    );

    // ── Controllers ──
    const catalogController = createCatalogController(catalogService);

    return {
        configRepo,
        syncLogRepo,
        catalogService,
        catalogController,
        createProvider,
    };
}
