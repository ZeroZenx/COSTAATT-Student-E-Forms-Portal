import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import SubmissionDetail from "@/components/submission-detail";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { getSubmission } from "@/lib/repository";

export default async function StudentSubmissionDetailPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const { id } = params;

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Student dashboard</p>
          <h1>Valid portal SSO is required.</h1>
          <p>Return to the student portal and open this service from your authenticated services page.</p>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  const submission = await getSubmission(id);
  const ownsSubmission = submission?.student.studentId === user.studentId;

  return (
    <main className="app-shell">
      <AppHeader
        user={user}
        staff={isStaff(user)}
        reviewer={hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"])}
      />
      <Link className="back-link" href="/student/dashboard"><ChevronLeft size={17} /> Back to my requests</Link>
      {submission && ownsSubmission ? (
        <SubmissionDetail initialSubmission={submission} viewer="student" />
      ) : (
        <section className="detail-panel">
          <p className="eyeline">Request detail</p>
          <h1>{submission ? "This request belongs to another student." : "Request not found."}</h1>
          <p className="empty-state">Students can only view their own e-form submissions.</p>
        </section>
      )}
    </main>
  );
}
