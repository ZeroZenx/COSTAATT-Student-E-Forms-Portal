import Link from "next/link";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import ReferenceImportHistory from "@/components/reference-import-history";
import { getCurrentUser, isRegistryAdmin } from "@/lib/auth";
import { referenceBulkImportEnabled } from "@/lib/reference-import";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReferenceImportHistoryPage() {
  const user = getCurrentUser();
  if (!user || !isRegistryAdmin(user)) return <main className="auth-shell"><section className="auth-panel"><BrandLogo className="auth-logo" /><h1>Registry admin access is required.</h1><Link className="primary-button" href="/forms">Return to e-forms</Link></section></main>;
  if (!referenceBulkImportEnabled()) return <main className="app-shell"><AppHeader user={user} staff reviewer /><section className="auth-panel"><h1>Bulk reference-data tools are not enabled.</h1><Link className="primary-button" href="/admin/reference-data">Back to reference data</Link></section></main>;
  return <main className="app-shell"><AppHeader user={user} staff reviewer /><section className="page-intro"><div><p className="eyeline">Registry administration</p><h1>Import history</h1><p>Review validated and completed reference-data imports and download row-level results.</p></div></section><ReferenceImportHistory /></main>;
}
