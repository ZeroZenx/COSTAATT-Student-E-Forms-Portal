"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { referenceColumns, referenceInstructions, REFERENCE_KIND_LABELS } from "@/lib/reference-csv";
import type { ReferenceKind } from "@/lib/reference-admin";
import type { ImportRowDetail, ImportSummary } from "@/lib/reference-import";

const kinds: ReferenceKind[] = ["course", "crn", "lecturer", "advisor", "programme_mapping"];
type Filter = "all" | "new" | "update" | "unchanged" | "invalid" | "conflict";

export default function ReferenceImportWizard() {
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<ReferenceKind>("course");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rows, setRows] = useState<ImportRowDetail[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const importViewVersion = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const importId = searchParams.get("importId");
    if (importId) void loadImport(importId);
  }, [searchParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (summary) void loadRows(summary.id);
  }, [summary?.id, filter, search, page]);

  async function loadImport(importId: string) {
    const viewVersion = importViewVersion.current;
    try {
      const response = await fetch(`/api/admin/reference-data/imports/${importId}?page=1&pageSize=50`, { cache: "no-store", credentials: "same-origin" });
      const result = await readImportResponse(response);
      if (viewVersion !== importViewVersion.current) return;
      if (!response.ok) { setMessage(result.error || "Import could not be loaded."); return; }
      setSummary(result.import);
      setKind(result.import.kind);
      setRows(Array.isArray(result.rows) ? result.rows : []);
      setTotalRows(Number(result.total || 0));
      setMessage("");
    } catch {
      if (viewVersion === importViewVersion.current) setMessage("Import preview could not be loaded. Check the connection and try again.");
    }
  }

  async function loadRows(importId: string) {
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (filter !== "all") params.set("status", filter);
    if (search.trim()) params.set("search", search.trim());
    const viewVersion = importViewVersion.current;
    try {
      const response = await fetch(`/api/admin/reference-data/imports/${importId}?${params.toString()}`, { cache: "no-store", credentials: "same-origin" });
      const result = await readImportResponse(response);
      if (viewVersion !== importViewVersion.current) return;
      if (response.ok) { setRows(Array.isArray(result.rows) ? result.rows : []); setTotalRows(Number(result.total || 0)); setMessage(""); }
      else setMessage(result.error || "Import preview rows could not be loaded.");
    } catch {
      if (viewVersion === importViewVersion.current) setMessage("Import preview rows could not be loaded. Check the connection and try again.");
    }
  }

  async function upload() {
    if (!file) { setMessage("Choose a CSV file first."); return; }
    importViewVersion.current += 1;
    window.history.replaceState(null, "", "/admin/reference-data/import");
    setSummary(null); setRows([]); setTotalRows(0); setAcknowledged(false); setPage(1);
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.append("kind", kind); form.append("file", file);
      const response = await fetch("/api/admin/reference-data/imports", { method: "POST", body: form, cache: "no-store", credentials: "same-origin" });
      const result = await readImportResponse(response);
      if (!response.ok) { setMessage(result.error || `CSV could not be validated (HTTP ${response.status}).`); return; }
      if (!result.import?.id) { setMessage("The server returned an incomplete import response. No database change was made."); return; }
      setSummary(result.import); setRows([]); setTotalRows(0); setAcknowledged(false); setPage(1);
      window.history.replaceState(null, "", `/admin/reference-data/import?importId=${result.import.id}`);
    } catch {
      setMessage("The upload request could not be completed. No database change was made; check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!summary || !acknowledged) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/reference-data/imports/${summary.id}/confirm`, { method: "POST", cache: "no-store", credentials: "same-origin" });
      const result = await readImportResponse(response);
      setBusy(false);
      if (!response.ok) { setMessage(result.error || "Import could not be confirmed."); if (response.status === 409) await loadImport(summary.id); return; }
      setSummary(result.import); setAcknowledged(false); await loadRows(summary.id);
    } catch {
      setBusy(false);
      setMessage("The import confirmation could not be completed. No database change was made unless the server reported success.");
    }
  }

  const hasBlockingRows = Boolean(summary && (summary.invalidCount > 0 || summary.conflictCount > 0));
  const steps = ["Select data type", "Upload CSV", "Validate", "Review preview", "Confirm", "Results"];
  const currentStep = !summary ? (file ? 2 : 1) : summary.status === "completed" ? 6 : 4;

  return <section className="import-workflow">
    <div className="import-stepper">{steps.map((step, index) => <div key={step} className={index + 1 <= currentStep ? "import-step active" : "import-step"}><span>{index + 1}</span>{step}</div>)}</div>
    <div className="import-toolbar"><Link className="back-link" href="/admin/reference-data">← Back to reference data</Link><Link className="secondary-button" href="/admin/reference-data/imports">Import History</Link></div>
    <div className="import-card">
      <p className="eyeline">1. Select data type</p>
      <div className="import-kind-grid">{kinds.map((item) => <button key={item} type="button" className={item === kind ? "active" : ""} onClick={() => { importViewVersion.current += 1; setKind(item); setFile(null); setSummary(null); setRows([]); setTotalRows(0); setAcknowledged(false); setPage(1); setMessage(""); }}>{REFERENCE_KIND_LABELS[item]}</button>)}</div>
      <p className="muted-copy">{referenceInstructions(kind).join(" ")}</p>
      <div className="import-actions"><a className="secondary-button" href={`/api/admin/reference-data/templates?kind=${kind}`}>Download Template</a><a className="secondary-button" href={`/api/admin/reference-data/export?kind=${kind}&active=all`}>Download Current Data</a></div>
    </div>
    <div className="import-card">
      <p className="eyeline">2. Upload CSV</p>
      <p className="muted-copy">Use UTF-8 CSV with these columns: {referenceColumns(kind).join(", ")}. Existing rows not present in the file are not changed.</p>
      <input type="file" accept=".csv,text/csv" onChange={(event) => { importViewVersion.current += 1; setFile(event.target.files?.[0] || null); setSummary(null); setRows([]); setTotalRows(0); setAcknowledged(false); setPage(1); setMessage(""); }} />
      <button className="primary-button" type="button" disabled={busy || !file} onClick={upload}>{busy ? "Working…" : "Upload and validate"}</button>
    </div>
    {summary ? <>
      <div className="import-card">
        <p className="eyeline">3–4. Validation and preview</p>
        <div className="import-summary-grid"><Summary label="Status" value={summary.status} /><Summary label="File" value={summary.originalFilename} /><Summary label="Uploaded by" value={summary.uploadedBy?.email || "—"} /><Summary label="Rows" value={summary.totalRows} /><Summary label="New" value={summary.newCount} /><Summary label="Updates" value={summary.updateCount} /><Summary label="Unchanged" value={summary.unchangedCount} /><Summary label="Invalid" value={summary.invalidCount} /><Summary label="Conflicts" value={summary.conflictCount} /></div>
        {hasBlockingRows ? <p className="error-message">This import is blocked. Resolve every invalid or conflicting row and upload a corrected CSV. Partial-row import is not available in v1.</p> : null}
        {summary.status === "stale" ? <p className="error-message">The database changed after this preview. Upload and validate the current CSV again.</p> : null}
        {summary.status === "completed" ? <p className="success-message">Import completed. <a href={`/api/admin/reference-data/imports/${summary.id}/results`}>Download Results CSV</a></p> : null}
      </div>
      <div className="import-card">
        <div className="reference-toolbar"><strong>Preview rows</strong><input placeholder="Search identifiers" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
        <div className="import-filters">{(["all", "new", "update", "unchanged", "invalid", "conflict"] as Filter[]).map((value) => <button key={value} type="button" className={value === filter ? "active" : ""} onClick={() => { setFilter(value); setPage(1); }}>{value === "update" ? "Updates" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        <div className="import-row-list">{rows.map((row) => <ImportRow key={row.id} row={row} />)}</div>
        <div className="reference-pagination"><span>{rows.length ? (page - 1) * 50 + 1 : 0}-{Math.min(page * 50, totalRows)} of {totalRows}</span><button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="secondary-button" type="button" disabled={page >= Math.max(1, Math.ceil(totalRows / 50))} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </div>
      {summary.status === "preview_ready" ? <div className="import-card import-confirm"><label><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /> I reviewed the preview and authorize this all-or-nothing database update.</label><button className="primary-button" type="button" disabled={!acknowledged || busy || hasBlockingRows} onClick={confirm}>{busy ? "Applying…" : "Confirm Import"}</button><p className="muted-copy">The final step revalidates PostgreSQL state while holding the reference-data advisory lock. The lock is not held during this review.</p></div> : null}
      {message ? <p className="error-message">{message}</p> : null}
    </> : null}
  </section>;
}

async function readImportResponse(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return { error: `The server returned an unreadable response (HTTP ${response.status}).` };
  }
}

function Summary({ label, value }: { label: string; value: string | number }) { return <div><span>{label}</span><strong>{value}</strong></div>; }

function ImportRow({ row }: { row: ImportRowDetail }) {
  return <div className="import-row"><div className="import-row-heading"><strong>Row {row.rowNumber}</strong><span>{row.identifier || "No identifier"}</span><em className={`status-pill status-${row.status}`}>{row.status === "update" ? "updates" : row.status}</em></div>{row.errors.length ? <p className="error-message">{row.errors.join(" ")}</p> : null}{row.warnings.length ? <p className="warning-message">{row.warnings.join(" ")}</p> : null}{row.status === "update" && row.current && row.proposed ? <div className="import-diff"><span>Current: {JSON.stringify(row.current.data)}</span><span>Proposed: {JSON.stringify(row.proposed.data)}</span></div> : null}{row.status === "new" && row.proposed ? <div className="import-diff"><span>Insert: {JSON.stringify(row.proposed.data)}</span></div> : null}{row.status === "unchanged" ? <small>Existing record unchanged.</small> : null}</div>;
}
