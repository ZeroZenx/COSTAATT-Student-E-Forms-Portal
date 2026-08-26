import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import CustomFormBuilder from "@/components/custom-form-builder";
import { getCurrentUser, isReviewer, isStaff } from "@/lib/auth";
import { canManageCustomForm } from "@/lib/custom-permissions";
import { getCustomForm } from "@/lib/custom-form-repository";

export default async function EditCustomFormPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const form = await getCustomForm(params.id);
  if (!form) notFound();
  if (!user || !canManageCustomForm(user, form)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <h1>Form access is required.</h1>
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
          <h1>{form.title}</h1>
          <p>{form.description}</p>
        </div>
      </section>
      <CustomFormBuilder initialForm={form} />
    </main>
  );
}
