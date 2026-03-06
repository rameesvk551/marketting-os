// features/catalog/index.ts
// Barrel export for the Catalog feature module.

// ── Page (entry point for routing) ──
export { default as CatalogDashboard } from './pages/CatalogDashboard';

// ── Components ──
export { default as CatalogConnectionCard } from './components/CatalogConnectionCard';
export { default as SyncHistoryTable } from './components/SyncHistoryTable';

// ── API ──
export { catalogApi } from './api/catalogApi';

// ── Services ──
export { catalogService } from './services';

// ── Hooks ──
export {
    useCatalogConfig,
    useSyncLogs,
    useSyncAllProducts,
    useConnectCatalog,
    useDisconnectCatalog,
} from './hooks/useCatalog';
