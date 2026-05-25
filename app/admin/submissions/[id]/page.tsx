import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import SubmissionDetail from "@/components/submission-detail";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getSubmission } from "@/lib/repository";

export default async function AdminSubmissionDetailPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const { id } = params;

  if (!user || !isStaff(user)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Registry services</p>
          <h1>Staff access is required.</h1>
          <p>Open this area from the portal with a Registry or administrator role. In local development, visit /api/dev/session first.</p>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  const submission = await getSubmission(id);

  return (
    <main className="app-shell">
      <AppHeader user={user} staff reviewer />
      <Link className="back-link" href="/admin/submissions"><ChevronLeft size={17} /> Back to Registry queue</Link>
      {submission ? (
        <SubmissionDetail initialSubmission={submission} viewer="registry" />
      ) : (
        <section className="detail-panel">
          <p className="eyeline">Submission detail</p>
          <h1>Submission not found.</h1>
          <p className="empty-state">The request may have been removed or the identifier is incorrect.</p>
        </section>
      )}
    </main>
  );
}
