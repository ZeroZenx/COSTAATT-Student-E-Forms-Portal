"use client";

import { useMemo, useState } from "react";
import type { DevIdentityOption } from "@/lib/dev-identities";
import type { SsoUser } from "@/lib/types";

export default function DevSessionControl({
  currentUser,
  identityOptions,
  reviewerOptions,
  initialIdentityId
}: {
  currentUser: SsoUser | null;
  identityOptions: DevIdentityOption[];
  reviewerOptions: DevIdentityOption[];
  initialIdentityId: string;
}) {
  const [identityId, setIdentityId] = useState(initialIdentityId);
  const [reviewerId, setReviewerId] = useState(reviewerOptions[0]?.id || "");
  const selectedIdentity = useMemo(
    () => identityOptions.find((option) => option.id === identityId) || identityOptions[0],
    [identityId, identityOptions]
  );
  const selectedReviewer = useMemo(
    () => reviewerOptions.find((option) => option.id === reviewerId) || reviewerOptions[0],
    [reviewerId, reviewerOptions]
  );
  const [reviewerRole, setReviewerRole] = useState(selectedReviewer?.roles.includes("advisor") ? "advisor" : "lecturer");

  function updateReviewer(id: string) {
    setReviewerId(id);
    const option = reviewerOptions.find((item) => item.id === id);
    setReviewerRole(option?.roles.includes("advisor") ? "advisor" : "lecturer");
  }

  return (
    <>
      <section className="dev-current-user">
        <h2>Current signed-in session</h2>
        {currentUser ? (
          <dl>
            <div><dt>Name</dt><dd>{currentUser.firstName} {currentUser.lastName}</dd></div>
            <div><dt>Email</dt><dd>{currentUser.email}</dd></div>
            <div><dt>ID</dt><dd>{currentUser.studentId}</dd></div>
            <div><dt>Roles</dt><dd>{displayRoles(currentUser.roles)}</dd></div>
          </dl>
        ) : (
          <p className="empty-state">No local demo session is active.</p>
        )}
      </section>

      <section className="dev-session-section">
        <h2>Switch demo identity</h2>
        <form className="dev-switch-card" action="/api/dev/session" method="post">
          <input type="hidden" name="action" value="switch" />
          <input type="hidden" name="identityId" value={selectedIdentity?.id || ""} />
          <label className="field">
            Person
            <select data-testid="demo-identity-picker" value={identityId} onChange={(event) => setIdentityId(event.target.value)} required>
              {groupedOptions(identityOptions).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {selectedIdentity ? <IdentityPreview option={selectedIdentity} /> : null}
          <button className="primary-button" type="submit">Start session</button>
        </form>
      </section>

      <section className="dev-session-section">
        <h2>Manual reviewer</h2>
        <form className="dev-reviewer-form" action="/api/dev/session" method="post">
          <input type="hidden" name="action" value="reviewer" />
          <input type="hidden" name="redirect" value="/advisor/requests" />
          <label className="field">
            Reviewer name
            <select data-testid="demo-reviewer-picker" value={reviewerId} onChange={(event) => updateReviewer(event.target.value)} required>
              {reviewerOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Reviewer email
            <input name="email" type="email" value={selectedReviewer?.email || ""} readOnly required />
          </label>
          <input name="name" type="hidden" value={selectedReviewer?.name || ""} />
          <label className="field">
            Reviewer role
            <select data-testid="demo-reviewer-role" name="role" value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value)} required>
              <option value="lecturer">Lecturer</option>
              <option value="advisor">Advisor</option>
            </select>
          </label>
          <label className="field">
            Optional ID
            <input name="studentId" placeholder={reviewerRole === "advisor" ? "ADVISOR-DEV" : "LECTURER-DEV"} />
          </label>
          <button className="primary-button" type="submit">Use this reviewer</button>
        </form>
      </section>
    </>
  );
}

function IdentityPreview({ option }: { option: DevIdentityOption }) {
  return (
    <div className="dev-preview-grid">
      <ReadOnly label="Name" value={option.name} />
      <ReadOnly label="Email" value={option.email} />
      <ReadOnly label="ID" value={option.studentId} />
      <ReadOnly label="Roles" value={displayRoles(option.roles)} />
      <ReadOnly label="Destination" value={option.redirectTo} />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <label className="field readonly">
      {label}
      <input value={value} readOnly />
    </label>
  );
}

function groupedOptions(options: DevIdentityOption[]) {
  return options.reduce<Array<[string, DevIdentityOption[]]>>((groups, option) => {
    const existing = groups.find(([group]) => group === option.group);
    if (existing) existing[1].push(option);
    else groups.push([option.group, [option]]);
    return groups;
  }, []);
}

function displayRoles(roles?: string[]) {
  return roles?.length ? roles.map((role) => role.replace(/_/g, " ")).join(", ") : "student";
}
