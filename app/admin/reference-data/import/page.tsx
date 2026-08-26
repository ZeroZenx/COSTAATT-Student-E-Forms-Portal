import Link from "next/link";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import ReferenceImportWizard from "@/components/reference-import-wizard";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { referenceBulkImportEnabled } from "@/lib/reference-import";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReferenceImportPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) return <main className="auth-shell"><section className="auth-panel"><BrandLogo className="auth-logo" /><h1>Registry admin access is required.</h1><Link className="primary-button" href="/forms">Return to e-forms</Link></section></main>;
  if (!referenceBulkImportEnabled()) return <main className="app-shell"><AppHeader user={user} staff reviewer /><section className="auth-panel"><p className="eyeline">Registry administration</p><h1>Bulk reference-data tools are not enabled.</h1><p>Enable the feature flag only after the production migration, inventory gate, test suite, current-data export, preview, and rollback checks are complete.</p><Link className="primary-button" href="/admin/reference-data">Back to reference data</Link></section></main>;
  return <main className="app-shell"><AppHeader user={user} staff reviewer /><section className="page-intro"><div><p className="eyeline">Registry administration</p><h1>Bulk reference-data import</h1><p>Upload, validate, preview, explicitly confirm, and audit an all-or-nothing update.</p></div></section><ReferenceImportWizard /></main>;
}
