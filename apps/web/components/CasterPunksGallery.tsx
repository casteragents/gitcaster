"use client";

import { useMemo, useState } from "react";

export type CasterPunkSample = {
  id: number;
  filename: string;
  bytes: number;
  sha256: string;
  previewPath: string;
  loading: "lazy";
};

export function CasterPunksGallery({ sample, pageSize = 8 }: { sample: CasterPunkSample[]; pageSize?: number }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(Math.ceil(sample.length / pageSize), 1);
  const visible = useMemo(() => {
    const start = page * pageSize;
    return sample.slice(start, start + pageSize);
  }, [page, pageSize, sample]);

  return (
    <div className="stack">
      <div className="actions" aria-label="Caster Punks sample pagination">
        <button className="button" type="button" onClick={() => setPage((value) => Math.max(value - 1, 0))} disabled={page === 0}>
          Previous
        </button>
        <span className="pill neutral">Page {page + 1} / {pages}</span>
        <button className="button" type="button" onClick={() => setPage((value) => Math.min(value + 1, pages - 1))} disabled={page >= pages - 1}>
          Next
        </button>
      </div>
      <div className="grid">
        {visible.map((punk) => (
          <article className="card" key={punk.filename}>
            <img
              src={punk.previewPath}
              alt={`Caster Punk #${punk.id}`}
              loading="lazy"
              width={180}
              height={180}
              style={{ width: "100%", height: "auto", borderRadius: 8, border: "1px solid rgba(154, 176, 196, 0.18)" }}
            />
            <h3>#{punk.id}</h3>
            <p>{punk.filename}</p>
            <p>{Math.round(punk.bytes / 1024)} KB</p>
            <p className="muted">{punk.sha256.slice(0, 16)}...</p>
          </article>
        ))}
      </div>
    </div>
  );
}
