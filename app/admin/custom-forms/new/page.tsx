import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import CustomFormBuilder from "@/components/custom-form-builder";
import { getCurrentUser, isReviewer, isStaff } from "@/lib/auth";
import { canCreateCustomForms } from "@/lib/custom-permissions";

export default function NewCustomFormPage() {
  const user = getCurrentUser();
  if (!user || !canCreateCustomForms(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <h1>Form builder access is required.</h1>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer={isReviewer(user)} />
      <Link className="back-link" href="/admin/custom-forms"><ChevronLeft size={17} /> Back to custom forms</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Form builder</p>
          <h1>New custom e-form</h1>
          <p>Build a student-facing form, workflow, and email notification setup.</p>
        </div>
      </section>
      <CustomFormBuilder />
    </main>
  );
}
