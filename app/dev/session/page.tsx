import Link from "next/link";
import { notFound } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import DevSessionControl from "@/components/dev-session-control";
import { getCurrentUser } from "@/lib/auth";
import { currentIdentityOptionId, devIdentityOptions, devIdentitySimulatorEnabled, reviewerDevIdentityOptions } from "@/lib/dev-identities";

export default function DevSessionPage() {
  if (!devIdentitySimulatorEnabled()) notFound();
  const user = getCurrentUser();
  const identityOptions = devIdentityOptions();
  const reviewerOptions = reviewerDevIdentityOptions();

  return (
    <main className="auth-shell dev-session-shell">
      <section className="auth-panel dev-session-panel">
        <BrandLogo className="auth-logo" />
        <p className="eyeline">Local development</p>
        <h1>Switch demo user</h1>
        <p>
          Use this page to simulate student, reviewer, and Registry identities while testing locally.
          This page is unavailable in production.
        </p>

        <DevSessionControl
          currentUser={user}
          identityOptions={identityOptions}
          reviewerOptions={reviewerOptions}
          initialIdentityId={currentIdentityOptionId(user)}
        />

        <div className="auth-actions">
          <Link className="primary-button" href="/forms">Go to e-forms</Link>
          <Link className="secondary-button" href="/advisor/requests">Go to reviewer queue</Link>
          <Link className="secondary-button" href="/admin">Go to admin</Link>
          <Link className="secondary-button" href="/api/dev/session?clear=1">Clear session</Link>
        </div>
      </section>
    </main>
  );
}
