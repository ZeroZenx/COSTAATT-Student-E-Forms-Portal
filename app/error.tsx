"use client";

import { useEffect } from "react";
import BrandLogo from "@/components/brand-logo";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("COSTAATT page error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="auth-shell">
      <section className="auth-panel" role="alert">
        <BrandLogo className="auth-logo" />
        <p className="eyeline">Service interruption</p>
        <h1>This page could not be loaded.</h1>
        <p>Your request was not changed. Try the page again, or return to the e-forms hub.</p>
        {error.digest ? <p className="error-reference">Reference: {error.digest}</p> : null}
        <div className="auth-actions">
          <button className="primary-button" type="button" onClick={reset}>Try again</button>
          <a className="secondary-button" href="/forms">Return to e-forms</a>
        </div>
      </section>
    </main>
  );
}
