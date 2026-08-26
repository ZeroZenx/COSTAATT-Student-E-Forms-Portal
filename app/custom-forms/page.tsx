import Link from "next/link";
import { ArrowRight, Calendar, ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { listPublishedCustomForms } from "@/lib/custom-form-repository";

export default async function CustomFormsPage() {
  const user = getCurrentUser();
  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Custom e-forms</p>
          <h1>Valid portal SSO is required.</h1>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  const forms = await listPublishedCustomForms();
  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer={hasAnyRole(user, ["advisor", "lecturer", "reviewer", "approver", "registry_admin", "system_admin"])} />
      <Link className="back-link" href="/forms"><ChevronLeft size={17} /> Back to Registry e-forms</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Student services</p>
          <h1>Custom e-forms</h1>
          <p>Open student services, department, counselling, graduation, and other published request forms.</p>
        </div>
      </section>
      <section className="form-grid">
        {forms.map((form) => (
          <article className="service-card" key={form.id}>
            <div className="card-icon"><Calendar size={22} /></div>
            <div>
              <h2>{form.title}</h2>
              <p>{form.description}</p>
            </div>
            <dl>
              <div>
                <dt>Department</dt>
                <dd>{form.department}</dd>
              </div>
              <div>
                <dt>Audience</dt>
                <dd>{form.targetAudience}</dd>
              </div>
            </dl>
            <Link className="card-action" href={`/custom-forms/${form.slug}`}>
              Start request <ArrowRight size={17} />
            </Link>
          </article>
        ))}
        {forms.length === 0 ? <p className="empty-state">No custom forms are open right now.</p> : null}
      </section>
    </main>
  );
}
