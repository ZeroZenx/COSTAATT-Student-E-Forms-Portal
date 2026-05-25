import Link from "next/link";
import { Download, ListChecks, Settings2 } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { listAllSubmissions } from "@/lib/repository";
import { formDefinitions, submissionStatuses } from "@/lib/forms";

export default async function RegistryDashboardPage() {
  const user = getCurrentUser();
  if (!user || !isStaff(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyeline">Registry dashboard</p>
          <h1>Staff access is required.</h1>
          <p>Open this dashboard from the authenticated portal with a Registry role. In local development, visit /api/dev/session first to create a demo staff session.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submissions = await listAllSubmissions();
  const counters = submissionStatuses.map((status) => ({
    status,
    count: submissions.filter((submission) => submission.status === status).length
  }));
  const pendingAdvisor = submissions.filter((submission) => submission.status === "pending_advisor_review");
  const pendingRegistry = submissions.filter((submission) => submission.status === "pending_registry_review");

  return (
    <main className="app-shell">
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry dashboard</p>
          <h1>Submission operations</h1>
          <p>Monitor status volume, pending approvals, overdue work, and export operational data.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="primary-button" href="/admin/submissions"><ListChecks size={17} /> Review queue</Link>
          <Link className="secondary-button" href="/admin/reference-data"><Settings2 size={17} /> Reference data</Link>
          <a className="secondary-button" href="/api/admin/submissions/export"><Download size={17} /> CSV export</a>
        </div>
      </section>
      <section className="dashboard-grid">
        {counters.map((item) => (
          <article className="metric-card" key={item.status}>
            <span>{item.status.replace(/_/g, " ")}</span>
            <strong>{item.count}</strong>
          </article>
        ))}
      </section>
      <section className="history-section">
        <h2>Pending work</h2>
        {[...pendingAdvisor, ...pendingRegistry].slice(0, 12).map((submission) => (
          <div className="submission-row" key={submission.id}>
            <div>
              <strong>{formDefinitions[submission.formType].title}</strong>
              <span>{submission.student.firstName} {submission.student.lastName} · {submission.assignedTo?.name || "Registry review"}</span>
            </div>
            <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
