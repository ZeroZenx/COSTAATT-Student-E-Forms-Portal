"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReferenceKind, ReferenceRecord } from "@/lib/reference-admin";
import { deletionConfirmationBlocked } from "@/lib/reference-deletion-ui";

const kinds: { value: ReferenceKind; label: string }[] = [
  { value: "course", label: "Courses" },
  { value: "crn", label: "CRNs" },
  { value: "lecturer", label: "Lecturers" },
  { value: "advisor", label: "Advisors" },
  { value: "programme_mapping", label: "Programme mappings" }
];

type Draft = {
  id?: string;
  key: string;
  label: string;
  email: string;
  courseCode: string;
  courseTitle: string;
  crn: string;
  campus: string;
  section: string;
  term: string;
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: "advisor" | "lecturer";
  programme: string;
};

type DeletionDependencyCounts = {
  courseAssignments: number;
  crnAssignments: number;
  activeRequests: number;
  historicalSubmissions: number;
  reviewerAssignments: number;
  programmeMappings: number;
  workflowAssignments: number;
  auditRecords: number;
  emailRoutingRecords: number;
};

type DeletionPreviewRow = {
  id: string;
  recordId: string;
  rowNumber: number;
  naturalKey: string;
  classification: "safe" | "blocked";
  result: string;
  blockReasons: string[];
  dependencyCounts: DeletionDependencyCounts;
  safeSnapshot: Record<string, unknown>;
};

type DeletionPreview = {
  id: string;
  kind: "course" | "crn" | "lecturer";
  scope: "single" | "all";
  operationType: "delete" | "delete_unreferenced" | "deactivate";
  status: string;
  requestedCount: number;
  safeCount: number;
  blockedCount: number;
  affectedCount: number;
  totalRows: number;
  page: number;
  pageSize: number;
  filter: "all" | "safe" | "blocked";
  search: string;
  rows: DeletionPreviewRow[];
};

const emptyDraft: Draft = {
  key: "",
  label: "",
  email: "",
  courseCode: "",
  courseTitle: "",
  crn: "",
  campus: "",
  section: "",
  term: "",
  reviewerName: "",
  reviewerEmail: "",
  reviewerRole: "advisor",
  programme: ""
};

export default function ReferenceDataAdmin({ initialRecords, initialKind = "course", initialTotal = initialRecords.length, initialCounts = {}, bulkToolsEnabled = false, allowIndividualDelete = false, allowDeleteAll = false, allowDeactivateAll = false }: { initialRecords: ReferenceRecord[]; initialKind?: ReferenceKind; initialTotal?: number; initialCounts?: Partial<Record<ReferenceKind, number>>; bulkToolsEnabled?: boolean; allowIndividualDelete?: boolean; allowDeleteAll?: boolean; allowDeactivateAll?: boolean }) {
  const [records, setRecords] = useState(initialRecords);
  const [total, setTotal] = useState(initialTotal);
  const [kind, setKind] = useState<ReferenceKind>(initialKind);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive" | "archived" | "all">("active");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
  const [deletionFilter, setDeletionFilter] = useState<"all" | "safe" | "blocked">("all");
  const [deletionSearch, setDeletionSearch] = useState("");
  const [deletionPage, setDeletionPage] = useState(1);
  const [deletionAcknowledged, setDeletionAcknowledged] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState("");
  const [deletionBusy, setDeletionBusy] = useState(false);

  // The loader intentionally follows the query state rather than the function identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void reloadRecords(); }, [kind, query, activeFilter, page]);

  // Preview rows are server-paginated so large CRN/Lecturer datasets are never rendered at once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (deletionPreview) void reloadDeletionPreview(); }, [deletionPage, deletionFilter, deletionSearch]);

  function switchKind(nextKind: ReferenceKind) {
    setKind(nextKind);
    setPage(1);
    setDraft(emptyDraft);
    setMessage("");
  }

  function editRecord(record: ReferenceRecord) {
    setMessage("");
    setDraft({
      ...emptyDraft,
      id: record.id,
      key: record.key,
      label: record.label,
      email: record.email || String(record.data.email || record.data.reviewerEmail || record.data.advisorEmail || ""),
      courseCode: String(record.data.courseCode || record.key || ""),
      courseTitle: String(record.data.courseTitle || record.label || ""),
      crn: String(record.data.crn || (record.kind === "crn" ? record.key : "")),
      campus: String(record.data.campus || ""),
      section: String(record.data.section || ""),
      term: String(record.data.term || ""),
      reviewerName: String(record.data.reviewerName || record.data.advisorName || record.data.name || record.label || ""),
      reviewerEmail: String(record.data.reviewerEmail || record.data.advisorEmail || record.data.email || record.email || ""),
      reviewerRole: String(record.data.reviewerRole || "advisor") === "lecturer" ? "lecturer" : "advisor",
      programme: String(record.data.programme || record.key || "")
    });
  }

  async function saveRecord() {
    setMessage("");
    const payload = buildPayload(kind, draft);
    const response = await fetch(draft.id ? `/api/admin/reference-data/${draft.id}` : "/api/admin/reference-data", {
      method: draft.id ? "PATCH" : "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Record could not be saved.");
      return;
    }
    await reloadRecords();
    setDraft(emptyDraft);
    setMessage("Reference record saved.");
  }

  async function setRecordActive(id: string, active: boolean) {
    const response = await fetch(`/api/admin/reference-data/${id}`, {
      method: "PATCH",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active })
    });
    const result = await response.json();
    if (response.ok) {
      await reloadRecords();
    } else {
      setMessage(result.error || `Record could not be ${active ? "reactivated" : "deactivated"}.`);
    }
  }

  async function setRecordArchived(id: string, archived: boolean) {
    try {
      const response = await fetch(`/api/admin/reference-data/${id}`, {
        method: "PATCH",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ archived })
      });
      const result = await readReferenceAdminResponse(response);
      if (response.ok) {
        await reloadRecords();
        setMessage(archived ? "Reference record archived." : "Reference record unarchived.");
      } else {
        setMessage(result.error || `Reference record could not be ${archived ? "archived" : "unarchived"}.`);
      }
    } catch {
      setMessage(`The ${archived ? "archive" : "unarchive"} request could not be completed. No data was changed; please refresh and try again.`);
    }
  }

  async function reloadRecords() {
    const params = new URLSearchParams({ kind, page: String(page), pageSize: "50", active: activeFilter });
    if (query.trim()) params.set("search", query.trim());
    const response = await fetch(`/api/admin/reference-data?${params.toString()}`, { cache: "no-store" });
    const result = await response.json();
    if (response.ok) {
      setRecords(result.records);
      setTotal(result.total);
    }
  }

  async function openDeletionPreview(operationType: "delete" | "delete_unreferenced" | "deactivate", recordId?: string) {
    setDeletionBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/reference-data/delete-preview", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, scope: recordId ? "single" : "all", operationType, recordId })
    });
    const result = await response.json();
    setDeletionBusy(false);
    if (!response.ok) {
      setMessage(result.error || "Dependency scan could not be completed.");
      return;
    }
    setDeletionFilter("all");
    setDeletionSearch("");
    setDeletionPage(1);
    setDeletionAcknowledged(false);
    setDeletionConfirmation("");
    setDeletionPreview(result.preview);
  }

  async function reloadDeletionPreview() {
    if (!deletionPreview) return;
    const params = new URLSearchParams({
      operationId: deletionPreview.id,
      page: String(deletionPage),
      pageSize: "25",
      filter: deletionFilter
    });
    if (deletionSearch.trim()) params.set("search", deletionSearch.trim());
    const response = await fetch(`/api/admin/reference-data/delete-preview?${params.toString()}`, { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setDeletionPreview(result.preview);
  }

  async function confirmDeletion() {
    if (!deletionPreview) return;
    setDeletionBusy(true);
    setMessage("");
    try {
      const body = {
        operationId: deletionPreview.id,
        acknowledged: deletionAcknowledged,
        confirmation: deletionConfirmation
      };
      const response = await fetch("/api/admin/reference-data/delete-confirm", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await readDeletionResponse(response);
      if (!response.ok || result.status === "stale" || result.status === "blocked" || !result.status) {
        setMessage(result.error || result.message || `The deletion request was rejected (HTTP ${response.status}).`);
        if (result.status === "stale") {
          setDeletionPreview({ ...deletionPreview, status: "stale" });
          setDeletionAcknowledged(false);
          setDeletionConfirmation("");
        }
        return;
      }
      setDeletionPreview(null);
      setDeletionAcknowledged(false);
      setDeletionConfirmation("");
      await reloadRecords();
      setMessage(result.operationType === "deactivate"
        ? "Reference records were deactivated successfully."
        : result.operationType === "delete_unreferenced"
          ? `${Number(result.deletedCount || 0).toLocaleString()} unreferenced ${referenceKindLabel(result.kind)} were permanently deleted; ${Number(result.blockedCount || 0).toLocaleString()} blocked records were left unchanged. Operation ${deletionPreview.id}.`
          : `Reference records were permanently deleted successfully. Operation ${deletionPreview.id}.`);
    } catch {
      setMessage("The confirmation request could not be completed. No deletion was applied; please generate a fresh preview and try again.");
    } finally {
      setDeletionBusy(false);
    }
  }

  function closeDeletionPreview() {
    if (deletionBusy) return;
    setDeletionPreview(null);
    setDeletionAcknowledged(false);
    setDeletionConfirmation("");
  }

  const deletionKind = kind === "course" || kind === "crn" || kind === "lecturer";
  const bulkDeletionKind = kind === "course" || kind === "crn" || kind === "lecturer";
  const expectedPhrase = deletionPreview ? expectedDeletionPhrase(deletionPreview) : "";
  const confirmationReady = Boolean(deletionPreview && deletionPreview.status !== "stale" && deletionAcknowledged && deletionConfirmation === expectedPhrase && !deletionBusy);
  const deleteBlocked = deletionPreview ? deletionConfirmationBlocked(deletionPreview.operationType, deletionPreview.safeCount, deletionPreview.blockedCount) : false;

  return (
    <section className="reference-layout">
      <aside className="step-rail">
        {kinds.map((item) => (
          <button key={item.value} className={item.value === kind ? "active" : ""} onClick={() => switchKind(item.value)}>
            <span>{initialCounts[item.value] ?? 0}</span>{item.label}
          </button>
        ))}
      </aside>
      <div className="detail-panel">
        <div className="reference-toolbar">
          <input placeholder={`Search ${kind.replace("_", " ")}`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
          <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value as typeof activeFilter); setPage(1); }} aria-label="Reference record status">
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
            <option value="archived">Archived only</option>
            <option value="all">All records</option>
          </select>
          <button className="secondary-button" type="button" onClick={() => setDraft(emptyDraft)}>New {kind.replace("_", " ")}</button>
          {bulkToolsEnabled ? <><Link className="secondary-button" href="/admin/reference-data/import">Bulk Import</Link><a className="secondary-button" href={`/api/admin/reference-data/templates?kind=${kind}`}>Download Template</a><a className="secondary-button" href={`/api/admin/reference-data/export?kind=${kind}&active=${activeFilter}`}>Download Current Data</a><Link className="secondary-button" href="/admin/reference-data/imports">Import History</Link></> : null}
        </div>
        <ReferenceEditor kind={kind} draft={draft} setDraft={setDraft} onSave={saveRecord} />
        {message ? <p className={/^(Reference record saved|Reference record archived|Reference record unarchived)/.test(message) ? "success-message" : "error-message"}>{message}</p> : null}
        <div className="reference-table">
          <div className="reference-head">
            <span>Key</span>
            <span>Label</span>
            <span>Email</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {records.map((record) => (
            <div key={record.id} className="reference-row">
              <strong>{record.key}</strong>
              <span>{record.label}</span>
              <span>{record.email || String(record.data.reviewerEmail || record.data.advisorEmail || record.data.email || "")}</span>
                <em className={`status-pill ${record.archived ? "status-declined" : record.active ? "status-approved" : "status-declined"}`}>{record.archived ? "archived" : record.active ? "active" : "inactive"}</em>
              <div className="row-actions">
                <button className="secondary-button" type="button" onClick={() => editRecord(record)}>Edit</button>
                {record.archived ? (
                  <button className="secondary-button" type="button" onClick={() => setRecordArchived(record.id, false)}>Unarchive</button>
                ) : (
                  <button className="secondary-button" type="button" onClick={() => setRecordActive(record.id, !record.active)}>
                    {record.active ? "Deactivate" : "Reactivate"}
                  </button>
                )}
                {!record.active && !record.archived ? <button className="secondary-button" type="button" onClick={() => setRecordArchived(record.id, true)}>Archive</button> : null}
                {deletionKind && allowIndividualDelete ? (
                  <details className="reference-more">
                    <summary className="secondary-button">More</summary>
                    <div className="reference-more-menu">
                      <button className="danger-button" type="button" onClick={() => void openDeletionPreview("delete", record.id)}>Delete Permanently</button>
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {bulkDeletionKind && (allowDeleteAll || (allowDeactivateAll && kind !== "course")) ? (
          <section className="reference-danger-zone">
            <div>
              <p className="eyeline">Danger zone</p>
              <h2>Bulk status and deletion actions</h2>
              <p>{kind === "course" ? "Delete Unreferenced removes only dependency-free Courses. Delete All remains all-or-nothing." : "Deactivate All preserves records. Delete Unreferenced removes only safe records. Delete All remains all-or-nothing."}</p>
            </div>
            <div className="reference-danger-actions">
              {allowDeactivateAll && kind !== "course" ? <button className="secondary-button" type="button" disabled={deletionBusy} onClick={() => void openDeletionPreview("deactivate")}>Deactivate All</button> : null}
              {allowDeleteAll ? <button className="danger-button" type="button" disabled={deletionBusy} onClick={() => void openDeletionPreview("delete_unreferenced")}>Delete Unreferenced {referenceKindLabel(kind)}</button> : null}
              {allowDeleteAll ? <button className="danger-button" type="button" disabled={deletionBusy} onClick={() => void openDeletionPreview("delete")}>Delete All {referenceKindLabel(kind)}</button> : null}
            </div>
          </section>
        ) : null}
        <div className="reference-pagination">
          <span>Showing {records.length ? (page - 1) * 50 + 1 : 0}-{Math.min(page * 50, total)} of {total}</span>
          <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <button className="secondary-button" type="button" disabled={page >= Math.max(1, Math.ceil(total / 50))} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
      {deletionPreview ? (
        <DeletionPreviewDialog
          preview={deletionPreview}
          filter={deletionFilter}
          search={deletionSearch}
          page={deletionPage}
          busy={deletionBusy}
          message={message}
          acknowledged={deletionAcknowledged}
          confirmation={deletionConfirmation}
          expectedPhrase={expectedPhrase}
          confirmationReady={confirmationReady && !deleteBlocked}
          onFilterChange={(next) => { setDeletionFilter(next); setDeletionPage(1); }}
          onSearchChange={(next) => { setDeletionSearch(next); setDeletionPage(1); }}
          onPageChange={setDeletionPage}
          onAcknowledgedChange={setDeletionAcknowledged}
          onConfirmationChange={setDeletionConfirmation}
          onConfirm={() => void confirmDeletion()}
          onClose={closeDeletionPreview}
        />
      ) : null}
    </section>
  );
}

function DeletionPreviewDialog({
  preview,
  filter,
  search,
  page,
  busy,
  message,
  acknowledged,
  confirmation,
  expectedPhrase,
  confirmationReady,
  onFilterChange,
  onSearchChange,
  onPageChange,
  onAcknowledgedChange,
  onConfirmationChange,
  onConfirm,
  onClose
}: {
  preview: DeletionPreview;
  filter: "all" | "safe" | "blocked";
  search: string;
  page: number;
  busy: boolean;
  message: string;
  acknowledged: boolean;
  confirmation: string;
  expectedPhrase: string;
  confirmationReady: boolean;
  onFilterChange: (filter: "all" | "safe" | "blocked") => void;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onAcknowledgedChange: (value: boolean) => void;
  onConfirmationChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const pageCount = Math.max(1, Math.ceil(preview.totalRows / preview.pageSize));
  const isDelete = preview.operationType !== "deactivate";
  const isBulkDeleteBlocked = preview.operationType === "delete" && preview.blockedCount > 0;
  const isUnreferencedDeleteBlocked = preview.operationType === "delete_unreferenced" && preview.safeCount === 0;
  const confirmationBlocked = preview.status === "stale" || deletionConfirmationBlocked(preview.operationType, preview.safeCount, preview.blockedCount);
  const actionLabel = preview.operationType === "delete_unreferenced"
    ? `Delete Unreferenced ${referenceKindLabel(preview.kind)}`
    : isDelete
      ? (preview.scope === "all" ? "Delete All" : "Delete Permanently")
      : (preview.scope === "all" ? "Deactivate All" : "Deactivate");

  return (
    <div className="reference-modal-backdrop" role="presentation">
      <section className="reference-modal" role="dialog" aria-modal="true" aria-labelledby="reference-deletion-title">
        <div className="reference-modal-header">
          <div>
            <p className="eyeline">Dependency scan and preview</p>
            <h2 id="reference-deletion-title">{actionLabel}: {referenceKindLabel(preview.kind)}</h2>
            <p className="muted-copy">Preview ID {preview.id}. This scan does not change reference data.</p>
          </div>
          <button className="link-button" type="button" onClick={onClose} disabled={busy}>Close</button>
        </div>
        {message ? <p className="error-message" role="alert">{message}</p> : null}
        <div className="reference-deletion-summary">
          <SummaryMetric label="Total" value={preview.requestedCount} />
          <SummaryMetric label="Safe" value={preview.safeCount} />
          <SummaryMetric label="Blocked" value={preview.blockedCount} />
          <SummaryMetric label={isDelete ? "To delete" : "To deactivate"} value={isBulkDeleteBlocked ? 0 : preview.affectedCount} />
        </div>
        {isBulkDeleteBlocked ? <p className="error-message">Delete All is blocked because at least one record has a dependency. Option B performs zero deletions.</p> : null}
        {isUnreferencedDeleteBlocked ? <p className="error-message">No unreferenced {referenceKindLabel(preview.kind)} are currently safe to delete.</p> : null}
        {preview.scope === "single" && preview.blockedCount > 0 ? <p className="error-message">This record cannot be permanently deleted because it is referenced. Deactivate is the recommended action.</p> : null}
        {preview.scope === "all" && preview.operationType === "deactivate" && preview.blockedCount > 0 ? <p className="warning-message">Blocked Lecturer records remain active. Reassign their active Course or CRN assignments before deactivating them.</p> : null}
        <div className="reference-deletion-filters">
          {(["all", "safe", "blocked"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} type="button" onClick={() => onFilterChange(value)}>{value === "all" ? "All" : value === "safe" ? "Safe to delete" : "Blocked"}</button>)}
          <input aria-label="Search deletion preview" placeholder="Search key or reason" value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </div>
        <div className="reference-deletion-table">
          <div className="reference-deletion-head"><span>Record</span><span>Status</span><span>Dependencies</span><span>Reason</span></div>
          {preview.rows.map((row) => (
            <div className="reference-deletion-row" key={row.id}>
              <div><strong>{row.naturalKey}</strong><small>{deletionSnapshotSummary(row.safeSnapshot, preview.kind)}</small></div>
              <span className={`status-pill ${row.classification === "safe" ? "status-approved" : "status-blocked"}`}>{row.classification === "safe" ? "Safe" : "Blocked"}</span>
              <span>{dependencySummary(row.dependencyCounts)}</span>
              <span>{row.blockReasons.length ? row.blockReasons.join(" ") : "No blocking dependencies."}</span>
            </div>
          ))}
          {!preview.rows.length ? <p className="muted-copy">No records match this filter.</p> : null}
        </div>
        <div className="reference-deletion-pagination">
          <span>Showing {preview.rows.length ? (page - 1) * preview.pageSize + 1 : 0}-{Math.min(page * preview.pageSize, preview.totalRows)} of {preview.totalRows}</span>
          <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
          <button className="secondary-button" type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
        <div className="reference-deletion-confirm">
          <label><input type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledgedChange(event.target.checked)} disabled={confirmationBlocked || busy} /> I reviewed the dependency preview and understand this action is permanent where applicable.</label>
          <label>Type <strong>{expectedPhrase}</strong> to confirm.
            <input value={confirmation} onChange={(event) => onConfirmationChange(event.target.value)} placeholder={expectedPhrase} disabled={confirmationBlocked || busy} />
          </label>
          {!confirmationReady && !confirmationBlocked && !busy ? <p className="warning-message" role="status">Check the acknowledgement box and type the exact confirmation phrase before submitting.</p> : null}
          <p className="muted-copy">The server reacquires the reference-data advisory lock and reruns dependency validation immediately before committing. {preview.operationType === "delete_unreferenced" ? `This operation will permanently delete ${preview.safeCount.toLocaleString()} unreferenced ${referenceKindLabel(preview.kind)} and leave ${preview.blockedCount.toLocaleString()} blocked records unchanged.` : ""}</p>
          <div className="reference-modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className={isDelete ? "danger-button" : "primary-button"} type="button" onClick={onConfirm} disabled={busy || confirmationBlocked}>{busy ? "Applying…" : actionLabel}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

async function readDeletionResponse(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return { error: `The server returned an unreadable response (HTTP ${response.status}).` };
  }
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return <div className="reference-deletion-metric"><span>{label}</span><strong>{value.toLocaleString()}</strong></div>;
}

function dependencySummary(counts: DeletionDependencyCounts) {
  const labels: Array<[keyof DeletionDependencyCounts, string]> = [
    ["courseAssignments", "Courses"],
    ["crnAssignments", "CRNs"],
    ["activeRequests", "active requests"],
    ["historicalSubmissions", "submissions"],
    ["reviewerAssignments", "reviewer assignments"],
    ["programmeMappings", "programme mappings"],
    ["workflowAssignments", "workflow assignments"],
    ["auditRecords", "audit records"],
    ["emailRoutingRecords", "routing records"]
  ];
  const values = labels.filter(([key]) => counts[key] > 0).map(([key, label]) => `${counts[key]} ${label}`);
  return values.length ? values.join(", ") : "None";
}

function deletionSnapshotSummary(snapshot: Record<string, unknown>, kind: "course" | "crn" | "lecturer") {
  const data = objectValue(snapshot.data);
  const nested = objectValue(data?.data);
  const value = (...keys: string[]) => keys.map((key) => data?.[key] ?? nested?.[key]).find((item) => item !== undefined && item !== null && String(item).trim()) as string | undefined;
  if (kind === "crn") return `${value("courseCode") || "Course unavailable"} · ${value("courseTitle") || "Title unavailable"} · ${value("reviewerName", "lecturerName", "advisorName") || "Reviewer unavailable"}`;
  if (kind === "course") return `${value("courseTitle", "label") || "Title unavailable"} · ${value("reviewerName", "lecturerName", "advisorName") || "Reviewer unavailable"}`;
  return `${value("name", "label") || "Name unavailable"} · ${value("email") || "Email unavailable"}`;
}

function objectValue(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function expectedDeletionPhrase(preview: DeletionPreview) {
  const label = referenceKindLabel(preview.kind).toUpperCase();
  if (preview.operationType === "delete_unreferenced") return `DELETE UNREFERENCED ${label}`;
  if (preview.scope === "all") return `${preview.operationType === "delete" ? "DELETE" : "DEACTIVATE"} ${label}`;
  return preview.operationType === "delete" ? "DELETE RECORD" : "DEACTIVATE RECORD";
}

function referenceKindLabel(kind: "course" | "crn" | "lecturer") {
  return kind === "course" ? "Courses" : kind === "crn" ? "CRNs" : "Lecturers";
}

async function readReferenceAdminResponse(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return {};
  }
}

function ReferenceEditor({
  kind,
  draft,
  setDraft,
  onSave
}: {
  kind: ReferenceKind;
  draft: Draft;
  setDraft: (draft: Draft) => void;
  onSave: () => void;
}) {
  return (
    <div className="reference-editor">
      {kind === "course" ? (
        <>
          <Field label="Course code" value={draft.courseCode} onChange={(courseCode) => setDraft({ ...draft, courseCode })} />
          <Field label="Course title" value={draft.courseTitle} onChange={(courseTitle) => setDraft({ ...draft, courseTitle })} />
          <Field label="Assigned reviewer" value={draft.reviewerName} onChange={(reviewerName) => setDraft({ ...draft, reviewerName })} />
          <Field label="Reviewer email" value={draft.reviewerEmail} onChange={(reviewerEmail) => setDraft({ ...draft, reviewerEmail })} />
          <RoleSelect draft={draft} setDraft={setDraft} />
        </>
      ) : null}
      {kind === "crn" ? (
        <>
          <Field label="CRN" value={draft.crn} onChange={(crn) => setDraft({ ...draft, crn })} />
          <Field label="Course code" value={draft.courseCode} onChange={(courseCode) => setDraft({ ...draft, courseCode })} />
          <Field label="Course title" value={draft.courseTitle} onChange={(courseTitle) => setDraft({ ...draft, courseTitle })} />
          <Field label="Campus" value={draft.campus} onChange={(campus) => setDraft({ ...draft, campus })} />
          <Field label="Section" value={draft.section} onChange={(section) => setDraft({ ...draft, section })} />
          <Field label="Term" value={draft.term} onChange={(term) => setDraft({ ...draft, term })} />
          <Field label="Assigned reviewer" value={draft.reviewerName} onChange={(reviewerName) => setDraft({ ...draft, reviewerName })} />
          <Field label="Reviewer email" value={draft.reviewerEmail} onChange={(reviewerEmail) => setDraft({ ...draft, reviewerEmail })} />
          <RoleSelect draft={draft} setDraft={setDraft} />
        </>
      ) : null}
      {kind === "lecturer" || kind === "advisor" ? (
        <>
          <Field label="Name" value={draft.label} onChange={(label) => setDraft({ ...draft, label })} />
          <Field label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
        </>
      ) : null}
      {kind === "programme_mapping" ? (
        <>
          <Field label="Programme" value={draft.programme} onChange={(programme) => setDraft({ ...draft, programme })} />
          <Field label="Advisor name" value={draft.reviewerName} onChange={(reviewerName) => setDraft({ ...draft, reviewerName })} />
          <Field label="Advisor email" value={draft.reviewerEmail} onChange={(reviewerEmail) => setDraft({ ...draft, reviewerEmail })} />
        </>
      ) : null}
      <button className="primary-button" type="button" onClick={onSave}>{draft.id ? "Save changes" : "Add record"}</button>
    </div>
  );
}

function RoleSelect({ draft, setDraft }: { draft: Draft; setDraft: (draft: Draft) => void }) {
  return (
    <label className="field">
      Reviewer role
      <select value={draft.reviewerRole} onChange={(event) => setDraft({ ...draft, reviewerRole: event.target.value as Draft["reviewerRole"] })}>
        <option value="advisor">Advisor</option>
        <option value="lecturer">Lecturer</option>
      </select>
    </label>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function buildPayload(kind: ReferenceKind, draft: Draft) {
  if (kind === "course") {
    return {
      id: draft.id,
      kind,
      key: draft.courseCode,
      label: draft.courseTitle || draft.courseCode,
      email: draft.reviewerEmail || undefined,
      data: {
        courseCode: draft.courseCode,
        courseTitle: draft.courseTitle,
        reviewerName: draft.reviewerName,
        reviewerEmail: draft.reviewerEmail,
        reviewerRole: draft.reviewerRole
      }
    };
  }
  if (kind === "crn") {
    return {
      id: draft.id,
      kind,
      key: draft.crn,
      label: draft.courseTitle || draft.courseCode || draft.crn,
      email: draft.reviewerEmail || undefined,
      data: {
        crn: draft.crn,
        courseCode: draft.courseCode,
        courseTitle: draft.courseTitle,
        campus: draft.campus,
        section: draft.section,
        term: draft.term,
        reviewerName: draft.reviewerName,
        reviewerEmail: draft.reviewerEmail,
        reviewerRole: draft.reviewerRole
      }
    };
  }
  if (kind === "programme_mapping") {
    return {
      id: draft.id,
      kind,
      key: draft.programme,
      label: draft.programme,
      email: draft.reviewerEmail || undefined,
      data: {
        programme: draft.programme,
        advisorName: draft.reviewerName,
        advisorEmail: draft.reviewerEmail
      }
    };
  }
  return {
    id: draft.id,
    kind,
    key: draft.email,
    label: draft.label,
    email: draft.email,
    data: {
      name: draft.label,
      email: draft.email
    }
  };
}
