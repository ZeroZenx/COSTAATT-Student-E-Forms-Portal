import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { listRegistryQueueSubmissions } from "@/lib/repository";
import AdminSubmissions from "@/components/admin-submissions";

export default async function AdminSubmissionsPage() {
  const user = getCurrentUser();

  if (!user || !isStaff(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Registry services</p>
          <h1>Staff access is required.</h1>
          <p>Open this area from the portal with a Registry or administrator role. In local development, visit /api/dev/session first to create a demo staff session.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submissions = await listRegistryQueueSubmissions();

  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/forms"><ChevronLeft size={17} /> Back to e-forms</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry workspace</p>
          <h1>Registry review queue</h1>
          <p>Review requests ready for Registry final action, including items with missing reviewer mappings.</p>
        </div>
        <a className="primary-button" href="/api/admin/submissions/export"><Download size={17} /> Export CSV</a>
      </section>
      <AdminSubmissions initialSubmissions={submissions} />
    </main>
  );
}
