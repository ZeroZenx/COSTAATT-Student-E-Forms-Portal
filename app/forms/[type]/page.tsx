import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import DevelopmentSessionLink from "@/components/development-session-link";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { getAdminSettings } from "@/lib/admin-settings";
import { formDefinitions, isFormType } from "@/lib/forms";
import { samlLoginUrl } from "@/lib/saml";
import FormWizard from "@/components/form-wizard";

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function FormTypePage({ params, searchParams }: { params: { type: string }; searchParams?: PageSearchParams }) {
  if (!isFormType(params.type)) notFound();
  const user = getCurrentUser();
  if (!user && process.env.NODE_ENV === "production") {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams || {})) {
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
    }
    const target = query.toString() ? `/forms/${params.type}?${query.toString()}` : `/forms/${params.type}`;
    redirect(samlLoginUrl(target));
  }

  const definition = formDefinitions[params.type];
  const settings = await getAdminSettings();
  const availability = settings.forms[params.type];

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">COSTAATT Student Portal</p>
          <h1>Valid portal SSO is required.</h1>
          <p>Return to the student portal and open this form from your authenticated services page.</p>
          <DevelopmentSessionLink href="/api/dev/session">Use local demo session</DevelopmentSessionLink>
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
      <Link className="back-link" href="/forms"><ChevronLeft size={17} /> Back to e-forms</Link>
      <section className="form-hero">
        <div>
          <p className="eyeline">{definition.code}</p>
          <h1>{definition.title}</h1>
          <p>{definition.description}</p>
        </div>
        <div className="identity-panel">
          <span>Student</span>
          <strong>{user.firstName} {user.lastName}</strong>
          <small>{user.studentId} · {user.email}</small>
        </div>
      </section>
      {availability.status === "closed" ? (
        <section className="auth-panel">
          <p className="eyeline">Form closed</p>
          <h2>{definition.title} is currently closed.</h2>
          <p>{availability.notice || "New submissions are not being accepted for this form at this time."}</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      ) : (
        <FormWizard
          formType={params.type}
          user={user}
          academicYearOptions={settings.system.academicYears}
          semesterOptions={settings.system.semesters}
        />
      )}
    </main>
  );
}
