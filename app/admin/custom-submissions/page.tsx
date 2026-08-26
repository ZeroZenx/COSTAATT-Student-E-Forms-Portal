import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import CustomSubmissions from "@/components/custom-submissions";
import { getCurrentUser, isReviewer, isStaff } from "@/lib/auth";
import { canCreateCustomForms } from "@/lib/custom-permissions";
import { listAssignedCustomSubmissions, listCustomSubmissions } from "@/lib/custom-form-repository";

export default async function CustomSubmissionsPage() {
  const user = getCurrentUser();
  if (!user || (!canCreateCustomForms(user) && !isReviewer(user))) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <h1>Staff access is required.</h1>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submissions = canCreateCustomForms(user) ? await listCustomSubmissions() : await listAssignedCustomSubmissions(user);
  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer={isReviewer(user)} />
      <Link className="back-link" href="/admin/custom-forms"><ChevronLeft size={17} /> Back to custom forms</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Custom forms</p>
          <h1>Submission review</h1>
          <p>Review assigned custom-form requests, update statuses, comment, and export submissions.</p>
        </div>
        {canCreateCustomForms(user) ? <a className="primary-button" href="/api/admin/custom-submissions/export"><Download size={17} /> Export CSV</a> : null}
      </section>
      <CustomSubmissions initialSubmissions={submissions} />
    </main>
  );
}
