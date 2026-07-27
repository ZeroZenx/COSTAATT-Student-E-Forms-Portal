import Link from "next/link";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import DevelopmentSessionLink from "@/components/development-session-link";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { listAllSubmissions, listAssignedSubmissions } from "@/lib/repository";
import AdvisorRequests from "@/components/advisor-requests";

export default async function AdvisorRequestsPage() {
  const user = getCurrentUser();
  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Advisor dashboard</p>
          <h1>Signed-in access is required.</h1>
          <p>Open assigned requests from the authenticated portal.</p>
          <div className="auth-actions">
            <DevelopmentSessionLink>Switch demo user</DevelopmentSessionLink>
            <Link className="secondary-button" href="/forms">Return to e-forms</Link>
          </div>
        </section>
      </main>
    );
  }

  const submissions = hasAnyRole(user, ["registry_admin", "system_admin"])
    ? await listAllSubmissions()
    : await listAssignedSubmissions(user);
  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer />
      <section className="page-intro">
        <div>
          <p className="eyeline">Advisor dashboard</p>
          <h1>Requests assigned to me</h1>
          <p>Review routed requests, record comments, and approve or decline before Registry final review.</p>
        </div>
      </section>
      <AdvisorRequests submissions={submissions} />
    </main>
  );
}
