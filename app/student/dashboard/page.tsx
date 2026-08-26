import Link from "next/link";
import AppHeader from "@/components/app-header";
import BrandLogo from "@/components/brand-logo";
import DevelopmentSessionLink from "@/components/development-session-link";
import { getCurrentUser, hasAnyRole, isStaff } from "@/lib/auth";
import { attachmentMeta, formLabel, formatDateTime, latestVisibleComment, reviewerDisplay, studentStatusLabel } from "@/lib/display";
import { listStudentCustomSubmissions } from "@/lib/custom-form-repository";
import { listStudentSubmissions } from "@/lib/repository";

export default async function StudentDashboardPage() {
  const user = getCurrentUser();
  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <BrandLogo className="auth-logo" />
          <p className="eyeline">Student dashboard</p>
          <h1>Valid portal SSO is required.</h1>
          <p>Return to the student portal and open this service from your authenticated services page.</p>
          <DevelopmentSessionLink href="/api/dev/session">Use local demo session</DevelopmentSessionLink>
        </section>
      </main>
    );
  }

  const submissions = await listStudentSubmissions(user.studentId);
  const customSubmissions = await listStudentCustomSubmissions(user.studentId);
  return (
    <main className="app-shell">
      <AppHeader
        user={user}
        staff={isStaff(user)}
        reviewer={hasAnyRole(user, ["advisor", "lecturer", "registry_admin", "system_admin"])}
      />
      <section className="page-intro">
        <div>
          <p className="eyeline">Student dashboard</p>
          <h1>My e-form requests</h1>
          <p>Track submitted requests, uploaded documents, Registry comments, and workflow history.</p>
        </div>
        <Link className="primary-button" href="/forms">Start a new request</Link>
      </section>
      <section className="submission-list">
        {customSubmissions.map((submission) => (
          <article className="detail-panel request-summary-card" key={submission.id}>
            <div className="detail-head">
              <div>
                <p className="eyeline">{submission.id}</p>
                <h2>{submission.formTitle}</h2>
              </div>
              <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
            </div>
            <p>Custom e-form submitted {formatDateTime(submission.createdAt)}.</p>
            <div className="detail-grid">
              <div>
                <span>Assigned reviewer</span>
                <strong>{submission.assignments[0]?.assignedTo.name || "Not assigned"}</strong>
              </div>
              <div>
                <span>Responses</span>
                <strong>{submission.responses.length}</strong>
              </div>
              <div>
                <span>Latest activity</span>
                <strong>{formatDateTime(submission.updatedAt)}</strong>
              </div>
              <div>
                <span>Form</span>
                <strong>{submission.formTitle}</strong>
              </div>
            </div>
          </article>
        ))}
        {submissions.map((submission) => (
          <Link className="detail-panel request-summary-card" href={`/student/dashboard/${submission.id}`} key={submission.id}>
            <div className="detail-head">
              <div>
                <p className="eyeline">{submission.id}</p>
                <h2>{formLabel(submission.formType)}</h2>
              </div>
              <span className={`status-pill status-${submission.status}`}>{studentStatusLabel(submission.status)}</span>
            </div>
            <p>{latestVisibleComment(submission)}</p>
            <div className="detail-grid">
              <div>
                <span>Assigned reviewer</span>
                <strong>{reviewerDisplay(submission)}</strong>
              </div>
              <div>
                <span>Attachment</span>
                <strong>{attachmentMeta(submission)}</strong>
              </div>
              <div>
                <span>Latest activity</span>
                <strong>{formatDateTime(submission.updatedAt)}</strong>
              </div>
              <div>
                <span>Course</span>
                <strong>{submission.payload.courses[0]?.courseCode || "Not provided"}</strong>
              </div>
            </div>
            <div className="timeline">
              {(submission.workflowHistory || []).slice(-2).map((event) => (
                <div key={event.id}>
                  <strong>{event.actorName}</strong>
                  <span>{formatDateTime(event.at)} · {event.toStatus ? studentStatusLabel(event.toStatus) : "Updated"}</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
        {submissions.length === 0 && customSubmissions.length === 0 ? <p className="empty-state">No submissions yet.</p> : null}
      </section>
    </main>
  );
}
