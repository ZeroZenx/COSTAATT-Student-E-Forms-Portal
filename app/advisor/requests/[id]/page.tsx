import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import SubmissionDetail from "@/components/submission-detail";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { getSubmission } from "@/lib/repository";
import { isAssignedReviewer } from "@/lib/workflow";

export default async function AdvisorRequestDetailPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const { id } = params;
  const hasReviewerRole = user && hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"]);

  if (!user || !hasReviewerRole) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Advisor dashboard</p>
          <h1>Advisor or lecturer access is required.</h1>
          <p>Open assigned requests from the authenticated portal.</p>
          <Link className="primary-button" href="/forms">Return to e-forms</Link>
        </section>
      </main>
    );
  }

  const submission = await getSubmission(id);
  const isAdminReviewer = hasAnyRole(user, ["registry_admin", "system_admin"]);
  const assigned = submission ? isAssignedReviewer(submission, user) : false;

  if (!submission || (!assigned && !isAdminReviewer)) {
    return (
      <main className="app-shell">
        <AppHeader user={user} staff={isStaff(user)} reviewer />
        <Link className="back-link" href="/advisor/requests"><ChevronLeft size={17} /> Back to assigned requests</Link>
        <section className="detail-panel">
          <p className="eyeline">Request detail</p>
          <h1>{submission ? "This request is not assigned to you." : "Request not found."}</h1>
          <p className="empty-state">Advisor and lecturer views only show requests assigned to the signed-in reviewer.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader user={user} staff={isStaff(user)} reviewer />
      <Link className="back-link" href="/advisor/requests"><ChevronLeft size={17} /> Back to assigned requests</Link>
      <SubmissionDetail initialSubmission={submission} viewer="reviewer" canAct={assigned} />
    </main>
  );
}
