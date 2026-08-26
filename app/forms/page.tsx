import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock, FileCheck2, ShieldCheck } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { getAdminSettings } from "@/lib/admin-settings";
import { listPublishedCustomForms } from "@/lib/custom-form-repository";
import { formDefinitions } from "@/lib/forms";
import { listStudentSubmissions } from "@/lib/repository";
import { samlLoginUrl } from "@/lib/saml";

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function FormsPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const user = getCurrentUser();
  if (!user && process.env.NODE_ENV === "production") {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams || {})) {
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
    }
    const target = query.toString() ? `/forms?${query.toString()}` : "/forms";
    redirect(samlLoginUrl(target));
  }

  const submissions = user ? await listStudentSubmissions(user.studentId) : [];
  const settings = user ? await getAdminSettings() : null;
  const customForms = user ? await listPublishedCustomForms() : [];

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">COSTAATT Student Portal</p>
          <h1>Valid portal SSO is required.</h1>
          <p>
            Students must enter this service from the authenticated student portal. For local development,
            create a signed demo session.
          </p>
          <Link className="primary-button" href="/api/dev/session">
            Use local demo session
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader
        user={user}
        staff={isStaff(user)}
        reviewer={hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"])}
      />
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry services</p>
          <h1>Student E-Forms</h1>
          <p>
            Complete registration support requests in one guided workflow. Your student details are pulled from
            the portal and attached to every submission.
          </p>
        </div>
        <div className="identity-panel">
          <span>Signed in</span>
          <strong>{user.firstName} {user.lastName}</strong>
          <small>{user.studentId} · {user.email}</small>
        </div>
      </section>

      <section className="form-grid" aria-label="Available e-forms">
        {Object.entries(formDefinitions).map(([slug, definition]) => {
          const Icon = definition.icon;
          const formStatus = settings?.forms[slug as keyof typeof formDefinitions];
          const closed = formStatus?.status === "closed";
          return (
            <article className="service-card" key={slug}>
              <div className="card-icon"><Icon size={22} /></div>
              <div>
                <h2>{definition.shortTitle}</h2>
                <p>{definition.description}</p>
                {closed ? <p className="notice-banner">{formStatus.notice || "This form is currently closed."}</p> : null}
              </div>
              <dl>
                <div>
                  <dt><Clock size={15} /> Processing</dt>
                  <dd>{definition.estimate}</dd>
                </div>
                <div>
                  <dt><FileCheck2 size={15} /> Required</dt>
                  <dd>{definition.requiredAttachment}</dd>
                </div>
              </dl>
              {closed ? (
                <span className="card-action disabled">Form closed</span>
              ) : (
                <Link className="card-action" href={`/forms/${slug}`}>
                  Start request <ArrowRight size={17} />
                </Link>
              )}
            </article>
          );
        })}
        {customForms.map((form) => (
          <article className="service-card" key={form.id}>
            <div className="card-icon"><FileCheck2 size={22} /></div>
            <div>
              <h2>{form.title}</h2>
              <p>{form.description}</p>
            </div>
            <dl>
              <div>
                <dt><Clock size={15} /> Department</dt>
                <dd>{form.department}</dd>
              </div>
              <div>
                <dt><FileCheck2 size={15} /> Audience</dt>
                <dd>{form.targetAudience}</dd>
              </div>
            </dl>
            <Link className="card-action" href={`/custom-forms/${form.slug}`}>
              Start request <ArrowRight size={17} />
            </Link>
          </article>
        ))}
      </section>

      <section className="history-section">
        <div className="section-heading">
          <div>
            <p className="eyeline">Your activity</p>
            <h2>Recent submissions</h2>
          </div>
          <ShieldCheck size={22} />
        </div>
        {submissions.length === 0 ? (
          <p className="empty-state">No submissions yet. Start with one of the forms above.</p>
        ) : (
          <div className="submission-list">
            {submissions.map((submission) => (
              <div className="submission-row" key={submission.id}>
                <div>
                  <strong>{formDefinitions[submission.formType].title}</strong>
                  <span>{new Date(submission.createdAt).toLocaleString()}</span>
                </div>
                <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
