import Link from "next/link";
import { Download, ListChecks, Settings2 } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { listAllSubmissions } from "@/lib/repository";
import { formDefinitions } from "@/lib/forms";
import {
  agingBucket,
  registryDashboardSummary,
  SLA_BUSINESS_DAYS,
  submissionOperationalSummary
} from "@/lib/dashboard";
import { formShortLabel, formatDateTime, reviewerDisplay, statusLabel } from "@/lib/display";
import type { FormType, SubmissionRecord } from "@/lib/types";

const metricLabels = [
  ["total", "Total submissions"],
  ["pendingReviewer", "Pending reviewer"],
  ["pendingRegistry", "Pending Registry"],
  ["needsInformation", "Needs information"],
  ["approved", "Approved"],
  ["declined", "Declined"],
  ["closed", "Closed"],
  ["noReviewerMapping", "No reviewer mapping"],
  ["overdue", "Overdue"]
] as const;

const agingBuckets = ["0-1 days", "2-3 days", "4-5 days", "6+ days"] as const;

export default async function RegistryDashboardPage() {
  const user = getCurrentUser();
  if (!user || !isStaff(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Registry dashboard</p>
          <h1>Staff access is required.</h1>
          <p>Open this dashboard from the authenticated portal with a Registry role.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submissions = await listAllSubmissions();
  const summary = registryDashboardSummary(submissions);

  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry dashboard</p>
          <h1>Submission operations</h1>
          <p>Monitor workload, aging, overdue requests, reviewer bottlenecks, and Registry-ready work. SLA risk begins after {SLA_BUSINESS_DAYS} business days.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="primary-button" href="/admin/submissions"><ListChecks size={17} /> Review queue</Link>
          <Link className="secondary-button" href="/admin/reference-data"><Settings2 size={17} /> Reference data</Link>
          <Link className="secondary-button" href="/admin/settings"><Settings2 size={17} /> Settings</Link>
          <Link className="secondary-button" href="/admin/diagnostics"><Settings2 size={17} /> Diagnostics</Link>
          <a className="secondary-button" href="/api/admin/submissions/export"><Download size={17} /> CSV export</a>
        </div>
      </section>

      <section className="dashboard-grid">
        {metricLabels.map(([key, label]) => (
          <article className={key === "overdue" && summary[key] > 0 ? "metric-card metric-alert" : "metric-card"} key={key}>
            <span>{label}</span>
            <strong>{summary[key]}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-two-column">
        <BreakdownPanel
          title="Form type breakdown"
          items={(Object.keys(formDefinitions) as FormType[]).map((formType) => ({
            label: formDefinitions[formType].shortTitle,
            count: summary.byForm[formType] || 0
          }))}
        />
        <BreakdownPanel
          title="Aging buckets"
          items={agingBuckets.map((bucket) => ({
            label: bucket,
            count: summary.byAging[bucket] || 0
          }))}
        />
      </section>

      <section className="dashboard-two-column">
        <OperationalList title="Overdue requests" submissions={summary.overdueRequests.slice(0, 8)} empty="No requests are currently overdue." />
        <OperationalList title="Needs action today" submissions={summary.needsActionToday.slice(0, 8)} empty="No pending requests need action right now." />
      </section>
    </main>
  );
}

function BreakdownPanel({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <section className="history-section dashboard-panel">
      <h2>{title}</h2>
      <div className="breakdown-list">
        {items.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function OperationalList({ title, submissions, empty }: { title: string; submissions: SubmissionRecord[]; empty: string }) {
  return (
    <section className="history-section dashboard-panel">
      <h2>{title}</h2>
      <div className="operations-list">
        {submissions.map((submission) => {
          const summary = submissionOperationalSummary(submission);
          return (
            <Link className="operations-row" href={`/admin/submissions/${submission.id}`} key={submission.id}>
              <div>
                <strong>{formShortLabel(submission.formType)} · {submission.student.firstName} {submission.student.lastName}</strong>
                <span>{submission.payload.courses[0]?.courseCode || "No course"} · {reviewerDisplay(submission)}</span>
                <small>Created {formatDateTime(submission.createdAt)}</small>
              </div>
              <div className="operations-status">
                <span className={`status-pill status-${submission.status}`}>{statusLabel(submission.status)}</span>
                <small className={`sla-pill sla-${summary.state}`}>{summary.stateLabel} · {summary.age} business days · {agingBucket(summary.age)}</small>
              </div>
            </Link>
          );
        })}
        {submissions.length === 0 ? <p className="empty-state">{empty}</p> : null}
      </div>
    </section>
  );
}
