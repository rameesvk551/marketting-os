export function RouteLoader() {
  return (
    <div className="route-loading-screen" role="status" aria-live="polite">
      <div className="route-loading-shell">
        <span className="route-loading-badge">Marketing OS</span>
        <h1 className="route-loading-title">Loading workspace</h1>
        <p className="route-loading-copy">Preparing a lighter mobile view...</p>
        <div className="route-loading-lines" aria-hidden="true">
          <span className="route-loading-line" />
          <span className="route-loading-line" />
          <span className="route-loading-line" />
        </div>
      </div>
    </div>
  );
}
