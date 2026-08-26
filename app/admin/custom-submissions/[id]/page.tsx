import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import CustomSubmissionDetail from "@/components/custom-submission-detail";
import { getCurrentUser, isReviewer, isStaff } from "@/lib/auth";
import { canViewCustomSubmission } from "@/lib/custom-permissions";
import { getCustomForm, getCustomSubmission } from "@/lib/custom-form-repository";

export default async function CustomSubmissionPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const submission = await getCustomSubmission(params.id);
  if (!submission) notFound();
  const form = await getCustomForm(submission.formId);

  if (!user || !canViewCustomSubmission(user, submission, form || undefined)) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <h1>Submission access is required.</h1>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer={isReviewer(user)} />
      <Link className="back-link" href="/admin/custom-submissions"><ChevronLeft size={17} /> Back to custom submissions</Link>
      <section className="page-intro">
        <div>
          <p className="eyeline">Custom form request</p>
          <h1>{submission.formTitle}</h1>
          <p>Review responses, workflow assignment, comments, status changes, and audit history.</p>
        </div>
      </section>
      <CustomSubmissionDetail initialSubmission={submission} />
    </main>
  );
}
