import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { listReferenceRecords } from "@/lib/reference-admin";
import ReferenceDataAdmin from "@/components/reference-data-admin";

export default async function ReferenceDataPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Registry administration</p>
          <h1>Registry admin access is required.</h1>
          <p>Reference data management is restricted to Registry administrators and system administrators. In local development, visit /api/dev/session first to create a demo admin session.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const records = await listReferenceRecords();
  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/admin/dashboard"><ChevronLeft size={17} /> Back to dashboard</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry administration</p>
          <h1>Academic reference data</h1>
          <p>Manage courses, CRNs, lecturers, advisors, and programme mappings used by routing and reporting.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="secondary-button" href="/admin/reference-data/courses">Courses</Link>
          <Link className="secondary-button" href="/admin/reference-data/crns">CRNs</Link>
          <Link className="secondary-button" href="/admin/reference-data/lecturers">Lecturers</Link>
          <Link className="secondary-button" href="/admin/reference-data/advisors">Advisors</Link>
        </div>
      </section>
      <ReferenceDataAdmin initialRecords={records} />
    </main>
  );
}
