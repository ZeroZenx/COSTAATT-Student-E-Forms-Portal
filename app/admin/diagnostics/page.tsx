import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import DiagnosticsActions from "@/components/diagnostics-actions";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { productionReadinessSnapshot } from "@/lib/production-readiness";

export default async function AdminDiagnosticsPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Production diagnostics</p>
          <h1>Registry admin access is required.</h1>
          <p>Diagnostics are restricted to Registry administrators and system administrators.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const snapshot = await productionReadinessSnapshot();
  const counts = snapshot.referenceCounts;

  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/admin/dashboard"><ChevronLeft size={17} /> Back to dashboard</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Production diagnostics</p>
          <h1>Readiness checks</h1>
          <p>Review deployment-critical services, data stores, and smoke-test routes before opening the portal to students.</p>
        </div>
        <div className="dashboard-actions">
          <a className="secondary-button" href="/api/health" target="_blank" rel="noreferrer">Health JSON <ExternalLink size={16} /></a>
          <Link className="primary-button" href="/forms">Student smoke test</Link>
        </div>
      </section>

      <section className="dashboard-grid diagnostics-metrics">
        <Metric label="Overall state" value={snapshot.state} alert={snapshot.state !== "ok"} />
        <Metric label="Version" value={snapshot.build.appVersion} alert={snapshot.build.gitCommit === "not-set"} />
        <Metric label="Git commit" value={snapshot.build.gitCommit.slice(0, 12)} alert={snapshot.build.gitCommit === "not-set"} />
        <Metric label="Environment" value={snapshot.environment} alert={snapshot.environment !== "production"} />
        <Metric label="Database" value={snapshot.database.state} alert={snapshot.database.state !== "ok"} />
        <Metric label="DB pool" value={`${snapshot.databasePool.totalCount}/${snapshot.databasePool.config.max}`} alert={snapshot.databasePool.waitingCount > 0} />
        <Metric label="Reference data" value={snapshot.storage.referenceData} alert={snapshot.storage.referenceData !== "postgres"} />
        <Metric label="Uploads" value={snapshot.storage.attachments} alert={snapshot.storage.attachments !== "s3"} />
        <Metric label="Email" value={snapshot.email.mode} alert={snapshot.email.mode !== "smtp"} />
        <Metric label="SSO" value={snapshot.sso.mode} alert={snapshot.sso.mode !== "quicklaunch-jwt"} />
        <Metric label="Generated" value={new Date(snapshot.generatedAt).toLocaleString()} />
      </section>

      <section className="dashboard-two-column">
        <section className="history-section dashboard-panel">
          <h2>Go-live checklist</h2>
          <div className="breakdown-list">
            <div><span>Build version</span><strong>{snapshot.build.appVersion}</strong><small>{snapshot.build.gitCommit}</small></div>
            <div><span>Production environment</span><strong>{snapshot.environment}</strong><small>{snapshot.environment === "production" ? "Production runtime enabled" : "Development runtime; validate again on Windows VM"}</small></div>
            <div><span>Upload storage</span><strong>{snapshot.storage.attachments}</strong><small>{snapshot.storage.attachments === "s3" ? "Object storage configured" : "Local VM disk; uploads folder must be backed up"}</small></div>
            <div><span>Registry email</span><strong>{snapshot.email.registryEmail}</strong><small>Email mode: {snapshot.email.mode} ({snapshot.email.source} settings)</small></div>
            <div><span>SLA scheduler</span><strong>{process.env.SLA_ESCALATION_SECRET ? "configured" : "missing secret"}</strong><small>Windows Task Scheduler requires a bearer secret</small></div>
            <div><span>Dev identity simulator</span><strong>{snapshot.environment === "production" ? "disabled" : "available"}</strong><small>/api/dev/session must return 404 in production</small></div>
          </div>
        </section>

        <section className="history-section dashboard-panel">
          <h2>Signed-in identity</h2>
          <div className="breakdown-list">
            <div><span>Name</span><strong>{user.firstName} {user.lastName}</strong></div>
            <div><span>Email</span><strong>{user.email}</strong></div>
            <div><span>Student ID</span><strong>{user.studentId}</strong></div>
            <div><span>Roles</span><strong>{user.roles?.join(", ") || "student"}</strong><small>Use this to verify QuickLaunch claims and internal role enrichment.</small></div>
          </div>
        </section>
      </section>

      <section className="dashboard-two-column">
        <section className="history-section dashboard-panel">
          <h2>Deployment checks</h2>
          <div className="breakdown-list">
            {snapshot.checks.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>
                <strong className={`status-pill status-${item.state === "ok" ? "registry_approved" : item.state === "degraded" ? "registry_declined" : "needs_information"}`}>
                  {item.state}
                </strong>
                <small>{item.message}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="history-section dashboard-panel">
          <h2>Reference data counts</h2>
          {counts ? (
            <div className="breakdown-list">
              <div><span>Total records</span><strong>{counts.total}</strong></div>
              <div><span>Active</span><strong>{counts.active}</strong></div>
              <div><span>Inactive</span><strong>{counts.inactive}</strong></div>
              <div><span>Courses</span><strong>{counts.course}</strong></div>
              <div><span>CRNs</span><strong>{counts.crn}</strong></div>
              <div><span>Lecturers</span><strong>{counts.lecturer}</strong></div>
              <div><span>Advisors</span><strong>{counts.advisor}</strong></div>
              <div><span>Programme mappings</span><strong>{counts.programme_mapping}</strong></div>
            </div>
          ) : (
            <p className="empty-state">Reference data counts could not be loaded.</p>
          )}
        </section>
      </section>

      <DiagnosticsActions defaultEmail={snapshot.email.registryEmail} />

      <section className="history-section dashboard-panel">
        <h2>Database pool</h2>
        <div className="breakdown-list">
          <div><span>Configured max</span><strong>{snapshot.databasePool.config.max}</strong></div>
          <div><span>Open clients</span><strong>{snapshot.databasePool.totalCount}</strong></div>
          <div><span>Idle clients</span><strong>{snapshot.databasePool.idleCount}</strong></div>
          <div><span>Waiting requests</span><strong>{snapshot.databasePool.waitingCount}</strong></div>
          <div><span>Connection timeout</span><strong>{snapshot.databasePool.config.connectionTimeoutMillis} ms</strong></div>
          <div><span>Statement timeout</span><strong>{snapshot.databasePool.config.statementTimeout} ms</strong></div>
        </div>
      </section>

      <section className="history-section dashboard-panel">
        <h2>Production smoke tests</h2>
        <div className="dashboard-actions">
          <Link className="secondary-button" href="/forms">Student forms</Link>
          <Link className="secondary-button" href="/student/dashboard">Student dashboard</Link>
          <Link className="secondary-button" href="/advisor/requests">Advisor queue</Link>
          <Link className="secondary-button" href="/admin/submissions">Registry queue</Link>
          <Link className="secondary-button" href="/admin/reference-data">Reference data</Link>
          <a className="secondary-button" href="/api/admin/submissions/export">CSV export</a>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <article className={alert ? "metric-card metric-alert" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
