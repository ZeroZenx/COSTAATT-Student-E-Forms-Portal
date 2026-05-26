import Link from "next/link";
import { notFound } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { getCurrentUser } from "@/lib/auth";
import { devIdentityPresets, devIdentitySimulatorEnabled } from "@/lib/dev-identities";

const presetLabels: Record<keyof typeof devIdentityPresets, string> = {
  student: "Darren as Student",
  all_access: "Darren Demo All Access",
  registry_staff: "Registry Staff",
  registry_admin: "Registry Admin",
  system_admin: "System Admin"
};

export default function DevSessionPage() {
  if (!devIdentitySimulatorEnabled()) notFound();
  const user = getCurrentUser();

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

        <section className="dev-current-user">
          <h2>Current session</h2>
          {user ? (
            <dl>
              <div><dt>Name</dt><dd>{user.firstName} {user.lastName}</dd></div>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Student ID</dt><dd>{user.studentId}</dd></div>
              <div><dt>Roles</dt><dd>{user.roles?.join(", ") || "student"}</dd></div>
            </dl>
          ) : (
            <p className="empty-state">No local demo session is active.</p>
          )}
        </section>

        <section className="dev-session-section">
          <h2>Preset users</h2>
          <div className="dev-preset-grid">
            {(Object.keys(devIdentityPresets) as Array<keyof typeof devIdentityPresets>).map((key) => (
              <Link className="secondary-button" key={key} href={`/api/dev/session?as=${key}&redirect=/dev/session`}>
                {presetLabels[key]}
              </Link>
            ))}
          </div>
        </section>

        <section className="dev-session-section">
          <h2>Manual reviewer</h2>
          <form className="dev-reviewer-form" action="/api/dev/session" method="post">
            <input type="hidden" name="redirect" value="/advisor/requests" />
            <label className="field">
              Reviewer name
              <input name="name" defaultValue="Jesinta Tobas" required />
            </label>
            <label className="field">
              Reviewer email
              <input name="email" type="email" defaultValue="nursingdepartment@costaatt.edu.tt" required />
            </label>
            <label className="field">
              Reviewer role
              <select name="role" defaultValue="lecturer" required>
                <option value="lecturer">Lecturer</option>
                <option value="advisor">Advisor</option>
              </select>
            </label>
            <label className="field">
              Optional ID
              <input name="studentId" placeholder="LECTURER-DEV" />
            </label>
            <button className="primary-button" type="submit">Use this reviewer</button>
          </form>
        </section>

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
