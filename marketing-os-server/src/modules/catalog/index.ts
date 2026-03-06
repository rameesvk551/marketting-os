// modules/catalog/index.ts
// Barrel export for the Catalog module.

export { createRouter } from './catalog.router.js';
export { createCatalogContainer, type CatalogContainer } from './container.js';
export type { IMetaCatalogService } from './services/MetaCatalogService.js';
export type { IMetaCatalogApiProvider } from './providers/MetaCatalogApiProvider.js';
