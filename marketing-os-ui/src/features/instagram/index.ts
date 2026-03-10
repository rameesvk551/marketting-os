// features/instagram/index.ts
// Barrel export for the Instagram feature module.

// ── Page (entry point for routing) ──
export { default as InstagramDashboard } from './pages/InstagramDashboard';

// ── Components ──
export { default as InstagramAccountCard } from './components/InstagramAccountCard';
export { default as PostComposer } from './components/PostComposer';
export { default as MediaLibrary } from './components/MediaLibrary';
export { default as InstagramAutomationBuilder } from './components/automation/InstagramAutomationBuilder';

// ── API ──
export { instagramApi } from './api/instagramApi';

// ── Services ──
export { accountService, contentService } from './services';

// ── Hooks ──
export { useInstagramAuth } from './hooks/useInstagramAuth';
export { useContentPublish } from './hooks/useContentPublish';
