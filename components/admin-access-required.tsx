"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function AdminAccessRequired() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo className="auth-logo" />
        <p className="eyeline">Registry administration</p>
        <h1>Staff access is required.</h1>
        <p>
          Open this area from the portal with a Registry or administrator role. In local development,
          create a demo staff session first.
        </p>
        <div className="auth-actions">
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
          <Link className="secondary-button" href="/dev/session">Switch demo user</Link>
          <Link className="secondary-button" href="/forms">Return to e-forms</Link>
        </div>
      </section>
    </main>
  );
}
