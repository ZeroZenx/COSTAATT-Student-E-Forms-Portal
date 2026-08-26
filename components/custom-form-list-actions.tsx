"use client";

import Link from "next/link";
import { useState } from "react";

export default function CustomFormListActions({ formId }: { formId: string }) {
  const [deleted, setDeleted] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteForm() {
    if (!window.confirm("Delete this custom form? It will be hidden from staff and students, but existing submissions and audit history will be preserved.")) {
      return;
    }
    const response = await fetch(`/api/admin/custom-forms/${formId}/archive`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Form could not be deleted.");
      return;
    }
    setDeleted(true);
  }

  if (deleted) return <span className="status-pill status-archived">deleted</span>;

  return (
    <div className="row-actions">
      <Link className="secondary-button" href={`/admin/custom-forms/${formId}/edit`}>Edit</Link>
      <Link className="secondary-button" href={`/admin/custom-forms/${formId}/preview`}>Preview</Link>
      <button type="button" className="secondary-button danger-button" onClick={deleteForm}>Delete</button>
      {message ? <small className="error-text">{message}</small> : null}
    </div>
  );
}
