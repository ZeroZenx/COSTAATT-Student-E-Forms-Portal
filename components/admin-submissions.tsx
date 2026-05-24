"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formDefinitions, submissionStatuses } from "@/lib/forms";
import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";

export default function AdminSubmissions({ initialSubmissions }: { initialSubmissions: SubmissionRecord[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState(initialSubmissions[0]?.id);
  const [query, setQuery] = useState("");
  const selected = submissions.find((submission) => submission.id === selectedId) || submissions[0];

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return submissions;
    return submissions.filter((submission) => {
      const haystack = [
        submission.id,
        formDefinitions[submission.formType].title,
        submission.status,
        submission.student.studentId,
        submission.student.firstName,
        submission.student.lastName,
        submission.student.email,
        submission.payload.courses.map((course) => course.courseCode).join(" ")
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [query, submissions]);

  async function patchSelected(patch: { status?: SubmissionStatus; adminComment?: string }) {
    if (!selected) return;
    const response = await fetch(`/api/admin/submissions/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
    const result = await response.json();
    if (response.ok) {
      setSubmissions((current) => current.map((item) => item.id === selected.id ? result.submission : item));
    }
  }

  return (
    <section className="admin-layout">
      <div className="queue-panel">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search by student, form, CRN, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="queue-list">
          {filtered.map((submission) => (
            <button className={submission.id === selected?.id ? "active" : ""} key={submission.id} onClick={() => setSelectedId(submission.id)}>
              <strong>{formDefinitions[submission.formType].shortTitle}</strong>
              <span>{submission.student.firstName} {submission.student.lastName}</span>
              <small>{new Date(submission.createdAt).toLocaleString()}</small>
              <em className={`status-pill status-${submission.status}`}>{submission.status.replace("_", " ")}</em>
            </button>
          ))}
          {filtered.length === 0 ? <p className="empty-state">No submissions match this search.</p> : null}
        </div>
      </div>

      <div className="detail-panel">
        {selected ? (
          <>
            <div className="detail-head">
              <div>
                <p className="eyeline">{selected.id}</p>
                <h2>{formDefinitions[selected.formType].title}</h2>
              </div>
              <select value={selected.status} onChange={(event) => patchSelected({ status: event.target.value as SubmissionStatus })}>
                {submissionStatuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="detail-grid">
              <Detail label="Student" value={`${selected.student.firstName} ${selected.student.lastName}`} />
              <Detail label="Student ID" value={selected.student.studentId} />
              <Detail label="Email" value={selected.student.email} />
              <Detail label="Programme" value={selected.payload.programme} />
              <Detail label="Degree" value={selected.payload.degree} />
              <Detail label="Academic period" value={`${selected.payload.academicYear} · ${selected.payload.semester}`} />
              <Detail label="Advisor" value={selected.payload.advisorName} />
              <Detail label="Request type" value={selected.payload.requestType} />
            </div>
            <div className="course-review">
              <h3>Courses</h3>
              {selected.payload.courses.map((course, index) => (
                <div key={`${course.crn}-${index}`}>
                  <span>{course.crn}</span>
                  <span>{course.courseCode}</span>
                  <strong>{course.courseTitle}</strong>
                </div>
              ))}
            </div>
            <div className="attachment-review">
              <h3>Attachment</h3>
              {selected.attachment ? (
                <p>
                  <a href={`/api/admin/submissions/${selected.id}/attachment`}>
                    {selected.attachment.fileName}
                  </a>
                  {" "}· {(selected.attachment.size / 1024).toFixed(1)} KB
                </p>
              ) : (
                <p>No attachment stored.</p>
              )}
            </div>
            <label className="textarea-field">
              Registry comment
              <textarea
                defaultValue={selected.adminComment || ""}
                onBlur={(event) => patchSelected({ adminComment: event.target.value })}
              />
            </label>
          </>
        ) : (
          <p className="empty-state">No submissions yet.</p>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}
