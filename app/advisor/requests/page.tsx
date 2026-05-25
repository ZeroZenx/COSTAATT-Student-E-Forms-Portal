import Link from "next/link";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { listAllSubmissions, listAssignedSubmissions } from "@/lib/repository";
import AdvisorRequests from "@/components/advisor-requests";

export default async function AdvisorRequestsPage() {
  const user = getCurrentUser();
  if (!user || !hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"])) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyeline">Advisor dashboard</p>
          <h1>Advisor or lecturer access is required.</h1>
          <p>Open assigned requests from the authenticated portal.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submissions = hasAnyRole(user, ["registry_admin", "system_admin"])
    ? await listAllSubmissions()
    : await listAssignedSubmissions(user);
  return (
    <main className="app-shell">
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
