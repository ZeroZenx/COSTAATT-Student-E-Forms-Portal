import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import ReferenceDataAdmin from "@/components/reference-data-admin";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { listReferenceRecordsPage, referenceRecordCounts, type ReferenceKind } from "@/lib/reference-admin";
import { canDeleteAllReferences, canDeleteReference, canDeactivateAllReferences } from "@/lib/reference-deletion-policy";
import { referenceBulkImportEnabled } from "@/lib/reference-import";

export default async function ReferenceDataPageByKind({ kind, title }: { kind: ReferenceKind; title: string }) {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Registry administration</p>
          <h1>Registry admin access is required.</h1>
          <p>Reference data management is restricted to Registry administrators and system administrators.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const [page, counts] = await Promise.all([listReferenceRecordsPage({ kind, active: "active", pageSize: 50 }), referenceRecordCounts()]);
  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/admin/reference-data"><ChevronLeft size={17} /> Back to reference data</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry administration</p>
          <h1>{title}</h1>
          <p>Manage active academic reference records used by student lookup, routing, dashboards, and reporting.</p>
        </div>
      </section>
      <ReferenceDataAdmin
        initialRecords={page.records}
        initialKind={kind}
        initialTotal={page.total}
        initialCounts={counts}
        bulkToolsEnabled={referenceBulkImportEnabled()}
        allowIndividualDelete={canDeleteReference(user)}
        allowDeleteAll={canDeleteAllReferences(user)}
        allowDeactivateAll={canDeactivateAllReferences(user)}
      />
    </main>
  );
}
