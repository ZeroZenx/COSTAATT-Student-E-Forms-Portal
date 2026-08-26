"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { REFERENCE_KIND_LABELS } from "@/lib/reference-csv";
import type { ReferenceKind } from "@/lib/reference-admin";
import type { ImportSummary } from "@/lib/reference-import";

export default function ReferenceImportHistory() {
  const [imports, setImports] = useState<ImportSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [page]);
  async function load() { const response = await fetch(`/api/admin/reference-data/imports?page=${page}&pageSize=25`, { cache: "no-store" }); const result = await response.json(); if (response.ok) { setImports(result.imports); setTotal(result.total); } }
  return <section className="import-card"><div className="reference-toolbar"><strong>Previous imports</strong><Link className="primary-button" href="/admin/reference-data/import">New Bulk Import</Link></div><div className="reference-table import-history-table"><div className="reference-head"><span>Date/time</span><span>Administrator</span><span>Type / filename</span><span>Rows</span><span>Outcome</span></div>{imports.map((item) => <div className="reference-row" key={item.id}><span>{new Date(item.createdAt).toLocaleString()}</span><span>{item.uploadedBy?.email || "—"}</span><span>{REFERENCE_KIND_LABELS[item.kind as ReferenceKind]}<br /><small>{item.originalFilename}</small></span><span>{item.totalRows}</span><span><em className={`status-pill status-${item.status}`}>{item.status}</em><br /><small>{item.insertedCount} inserted · {item.updatedCount} updated · {item.skippedCount} unchanged</small><br /><Link href={`/admin/reference-data/import?importId=${item.id}`}>Open details</Link></span></div>)}</div><div className="reference-pagination"><span>{imports.length ? (page - 1) * 25 + 1 : 0}-{Math.min(page * 25, total)} of {total}</span><button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="secondary-button" type="button" disabled={page >= Math.max(1, Math.ceil(total / 25))} onClick={() => setPage((value) => value + 1)}>Next</button></div></section>;
}
