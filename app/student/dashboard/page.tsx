import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { formDefinitions } from "@/lib/forms";
import { listStudentSubmissions } from "@/lib/repository";

export default async function StudentDashboardPage() {
  const user = getCurrentUser();
  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyeline">Student dashboard</p>
          <h1>Valid portal SSO is required.</h1>
          <p>Return to the student portal and open this service from your authenticated services page.</p>
          <Link className="primary-button" href="/api/dev/session">Use local demo session</Link>
        </section>
      </main>
    );
  }

  const submissions = await listStudentSubmissions(user.studentId);
  return (
    <main className="app-shell">
      <section className="page-intro">
        <div>
          <p className="eyeline">Student dashboard</p>
          <h1>My e-form requests</h1>
          <p>Track submitted requests, uploaded documents, Registry comments, and workflow history.</p>
        </div>
        <Link className="primary-button" href="/forms">Start a new request</Link>
      </section>
      <section className="submission-list">
        {submissions.map((submission) => (
          <article className="detail-panel" key={submission.id}>
            <div className="detail-head">
              <div>
                <p className="eyeline">{submission.id}</p>
                <h2>{formDefinitions[submission.formType].title}</h2>
              </div>
              <span className={`status-pill status-${submission.status}`}>{submission.status.replace(/_/g, " ")}</span>
            </div>
            <p>{submission.registryComment || submission.adminComment || submission.reviewerComment || "No comments yet."}</p>
            <div className="detail-grid">
              <div>
                <span>Assigned reviewer</span>
                <strong>{submission.assignedTo?.name || "Registry triage"}</strong>
              </div>
              <div>
                <span>Attachment</span>
                <strong>{submission.attachment?.fileName || "No attachment stored"}</strong>
              </div>
            </div>
            <div className="timeline">
              {(submission.workflowHistory || []).map((event) => (
                <div key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{new Date(event.at).toLocaleString()} · {event.toStatus?.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
        {submissions.length === 0 ? <p className="empty-state">No submissions yet.</p> : null}
      </section>
    </main>
  );
}
