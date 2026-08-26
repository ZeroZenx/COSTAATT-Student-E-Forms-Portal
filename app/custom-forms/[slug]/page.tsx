import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import CustomFormRenderer from "@/components/custom-form-renderer";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { getCustomForm, isCustomFormAvailable } from "@/lib/custom-form-repository";

export default async function CustomFormPage({ params }: { params: { slug: string } }) {
  const user = getCurrentUser();
  const form = await getCustomForm(params.slug);
  if (!form) notFound();

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <h1>Valid portal SSO is required.</h1>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer={hasAnyRole(user, ["advisor", "lecturer", "reviewer", "approver", "registry_admin", "system_admin"])} />
      <Link className="back-link" href="/custom-forms"><ChevronLeft size={17} /> Back to custom e-forms</Link>
      <section className="form-hero">
        <div>
          <p className="eyeline">{form.department}</p>
          <h1>{form.title}</h1>
          <p>{form.description}</p>
        </div>
        <div className="identity-panel">
          <span>Student</span>
          <strong>{user.firstName} {user.lastName}</strong>
          <small>{user.studentId} - {user.email}</small>
        </div>
      </section>
      {!isCustomFormAvailable(form) ? (
        <section className="auth-panel">
          <p className="eyeline">Form closed</p>
          <h2>{form.title} is not open.</h2>
          <p>New submissions are not being accepted for this form at this time.</p>
          <Link className="primary-button" href="/custom-forms">Return to custom e-forms</Link>
        </section>
      ) : (
        <CustomFormRenderer form={form} user={user} />
      )}
    </main>
  );
}
