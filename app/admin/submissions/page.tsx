import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { listAllSubmissions } from "@/lib/repository";
import AdminSubmissions from "@/components/admin-submissions";

export default async function AdminSubmissionsPage() {
  const user = getCurrentUser();

  if (!user || !isStaff(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyeline">Registry services</p>
          <h1>Staff access is required.</h1>
          <p>Open this area from the portal with a Registry or administrator role.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submissions = await listAllSubmissions();

  return (
    <main className="app-shell">
      <Link className="back-link" href="/forms"><ChevronLeft size={17} /> Back to e-forms</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Registry workspace</p>
          <h1>Submission review</h1>
          <p>Search, review, comment, and update student e-form requests.</p>
        </div>
        <a className="primary-button" href="/api/admin/submissions/export"><Download size={17} /> Export CSV</a>
      </section>
      <AdminSubmissions initialSubmissions={submissions} />
    </main>
  );
}
