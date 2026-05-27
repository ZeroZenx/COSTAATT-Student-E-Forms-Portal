"use client";

import { useState } from "react";

type EmailOutcome = {
  mode: string;
  outcome: string;
  to?: string;
  error?: string;
  messageId?: string;
};

type SlaResult = {
  scanned: number;
  overdue: number;
  reviewerReminders: number;
  registryReminders: number;
  skipped: number;
  failed: number;
  loggedOrSent: number;
};

export default function DiagnosticsActions({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [label, setLabel] = useState("Go-live diagnostics");
  const [emailOutcome, setEmailOutcome] = useState<EmailOutcome | null>(null);
  const [slaResult, setSlaResult] = useState<SlaResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function sendTestEmail() {
    setBusy("email");
    setMessage("");
    setEmailOutcome(null);
    const response = await fetch("/api/admin/diagnostics/email-test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: email, label })
    });
    const result = await response.json();
    setBusy("");
    if (!response.ok) {
      setMessage(result.error || "Email test failed.");
      return;
    }
    setEmailOutcome(result.outcome);
  }

  async function runSlaDryRun() {
    setBusy("sla");
    setMessage("");
    setSlaResult(null);
    const response = await fetch("/api/admin/diagnostics/sla-dry-run", { method: "POST" });
    const result = await response.json();
    setBusy("");
    if (!response.ok) {
      setMessage(result.error || "SLA dry-run failed.");
      return;
    }
    setSlaResult(result);
  }

  return (
    <section className="history-section dashboard-panel">
      <h2>Safe operations tests</h2>
      <div className="diagnostics-action-grid">
        <div className="diagnostics-action-card">
          <h3>Email test</h3>
          <p>Send or log a diagnostic email without changing any submission.</p>
          <label className="field">
            Recipient
            <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            Label
            <input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <button className="primary-button" type="button" disabled={Boolean(busy)} onClick={sendTestEmail}>
            {busy === "email" ? "Sending..." : "Send test email"}
          </button>
          {emailOutcome ? (
            <p className="success-message">
              {emailOutcome.outcome} in {emailOutcome.mode} mode for {emailOutcome.to}
              {emailOutcome.messageId ? ` · ${emailOutcome.messageId}` : ""}
            </p>
          ) : null}
        </div>

        <div className="diagnostics-action-card">
          <h3>SLA dry-run</h3>
          <p>Preview overdue reminder targets without sending escalation emails.</p>
          <button className="secondary-button" type="button" disabled={Boolean(busy)} onClick={runSlaDryRun}>
            {busy === "sla" ? "Checking..." : "Run dry-run"}
          </button>
          {slaResult ? (
            <div className="breakdown-list compact-breakdown">
              <div><span>Scanned</span><strong>{slaResult.scanned}</strong></div>
              <div><span>Overdue</span><strong>{slaResult.overdue}</strong></div>
              <div><span>Reviewer reminders</span><strong>{slaResult.reviewerReminders}</strong></div>
              <div><span>Registry reminders</span><strong>{slaResult.registryReminders}</strong></div>
              <div><span>Skipped</span><strong>{slaResult.skipped}</strong></div>
              <div><span>Failed</span><strong>{slaResult.failed}</strong></div>
            </div>
          ) : null}
        </div>
      </div>
      {message ? <p className="error-message">{message}</p> : null}
    </section>
  );
}
