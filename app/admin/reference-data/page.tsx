import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { listReferenceRecords } from "@/lib/reference-admin";
import ReferenceDataAdmin from "@/components/reference-data-admin";

export default async function ReferenceDataPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyeline">Registry administration</p>
          <h1>Registry admin access is required.</h1>
          <p>Reference data management is restricted to Registry administrators and system administrators.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const records = await listReferenceRecords();
  return (
    <main className="app-shell">
      <Link className="back-link" href="/admin/dashboard"><ChevronLeft size={17} /> Back to dashboard</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry administration</p>
          <h1>Academic reference data</h1>
          <p>Manage courses, CRNs, lecturers, advisors, and programme mappings used by routing and reporting.</p>
        </div>
      </section>
      <ReferenceDataAdmin initialRecords={records} />
    </main>
  );
}
