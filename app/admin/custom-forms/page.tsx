import Link from "next/link";
import { ChevronLeft, FilePlus2, ListChecks } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import CustomFormListActions from "@/components/custom-form-list-actions";
import { getCurrentUser, isReviewer, isStaff } from "@/lib/auth";
import { canCreateCustomForms } from "@/lib/custom-permissions";
import { listCustomForms } from "@/lib/custom-form-repository";

export default async function CustomFormsAdminPage() {
  const user = getCurrentUser();
  if (!user || !canCreateCustomForms(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Custom forms</p>
          <h1>Form builder access is required.</h1>
          <p>Open this area with a form creator, form manager, Registry admin, or system admin role.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const forms = await listCustomForms();
  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer={isReviewer(user)} />
      <Link className="back-link" href="/admin/dashboard"><ChevronLeft size={17} /> Back to dashboard</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Phase 3</p>
          <h1>Custom e-forms</h1>
          <p>Create reusable student-facing e-forms without changing the fixed Registry forms.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="primary-button" href="/admin/custom-forms/new"><FilePlus2 size={17} /> New form</Link>
          <Link className="secondary-button" href="/admin/custom-submissions"><ListChecks size={17} /> Submissions</Link>
        </div>
      </section>
      <section className="queue-table">
        {forms.map((form) => (
          <article className="queue-card" key={form.id}>
            <div>
              <p className="eyeline">{form.slug}</p>
              <h3>{form.title}</h3>
              <p>{form.department} - {form.targetAudience}</p>
            </div>
            <div className="queue-meta">
              <span>Version {form.versionNumber}</span>
              <span>{form.openAt ? `Opens ${new Date(form.openAt).toLocaleString()}` : "No open date"}</span>
              <span>{form.closeAt ? `Closes ${new Date(form.closeAt).toLocaleString()}` : "No close date"}</span>
            </div>
            <div className="queue-status-cell">
              <span className={`status-pill status-${form.status}`}>{form.status}</span>
              <CustomFormListActions formId={form.id} />
            </div>
          </article>
        ))}
        {forms.length === 0 ? <p className="empty-state">No custom forms have been created yet.</p> : null}
      </section>
    </main>
  );
}
