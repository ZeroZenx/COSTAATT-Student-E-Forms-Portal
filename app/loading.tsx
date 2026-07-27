export default function LoadingPage() {
  return (
    <main className="auth-shell" aria-busy="true" aria-live="polite">
      <section className="auth-panel loading-panel">
        <div className="loading-indicator" aria-hidden="true" />
        <p>Loading COSTAATT Student E-Forms...</p>
      </section>
    </main>
  );
}
