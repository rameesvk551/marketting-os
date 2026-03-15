// features/instagram/index.ts
// Barrel export for the Instagram feature module.

// Pages
export { default as InstagramDashboard } from './pages/InstagramDashboard';
export { default as InstagramAutomationPage } from './pages/InstagramAutomationPage';

// Components
export { default as InstagramAccountCard } from './components/InstagramAccountCard';
export { default as PostComposer } from './components/PostComposer';
export { default as MediaLibrary } from './components/MediaLibrary';
export { default as InstagramAutomationBuilder } from './components/automation/InstagramAutomationBuilder';
export { default as InstagramAutomationForm } from './components/automation/InstagramAutomationForm';
export { default as InstagramAutomationsList } from './components/automation/InstagramAutomationsList';
export { default as InstagramInboxWorkspace } from './components/inbox/InstagramInboxWorkspace';

// API
export { instagramApi } from './api/instagramApi';

// Services
export { accountService, contentService } from './services';

// Hooks
export { useInstagramAuth } from './hooks/useInstagramAuth';
export { useContentPublish } from './hooks/useContentPublish';
