import { TruthStatusPill } from "./TruthStatusPill";
import type { GitCasterTruthStatus } from "../lib/status-truth";

type Proof = {
  live?: boolean;
  deployed?: boolean;
  verified?: boolean;
  qstorageVerified?: boolean;
  castercloudVerified?: boolean;
  securityReviewed?: boolean;
  evidence?: string[];
};

type Safety = {
  sensitivity?: string;
  runtimeStatePublic?: boolean;
  secretsExposed?: boolean;
  imagesBundled?: boolean;
  redacted?: boolean;
};

export type EcosystemDirectoryEntry = {
  id: string;
  name: string;
  category: string;
  status: string;
  description?: string;
  publicDescription?: string;
  sourcePath?: string;
  uses?: string[];
  proof?: Proof;
  safety?: Safety;
  blockers?: string[];
};

export function EcosystemDirectory({
  entries,
  summary,
  showProof = true,
  showBlockers = true
}: {
  entries: EcosystemDirectoryEntry[];
  summary?: Record<string, unknown>;
  showProof?: boolean;
  showBlockers?: boolean;
}) {
  const grouped = groupByCategory(entries);
  return (
    <div className="stack">
      <div className="card">
        <h2>RC directory</h2>
        <p>Listings are proof-aware and never automatic approval. Stronger labels require evidence before they render as claims.</p>
        {summary ? (
          <div className="truth-grid">
            <span>Entries: {String(summary.entriesTotal ?? entries.length)}</span>
            <span>Needs review: {String(summary.needsReview ?? 0)}</span>
            <span>Blocked: {String(summary.blocked ?? 0)}</span>
            <span>Sensitive: {String(summary.sensitive ?? 0)}</span>
          </div>
        ) : null}
      </div>
      {Object.entries(grouped).map(([category, items]) => (
        <section className="section" key={category}>
          <h2>{category}</h2>
          <div className="grid">
            {items.map((entry) => (
              <article className="card" key={entry.id}>
                <div className="row-between">
                  <h3>{entry.name}</h3>
                  <TruthStatusPill status={statusForPill(entry.status)} evidence={hasStrongProof(entry.proof) ? firstEvidence(entry.proof) : undefined} />
                </div>
                <p>{entry.description ?? entry.publicDescription ?? "Preview ecosystem entry."}</p>
                <p>Sensitivity: {entry.safety?.sensitivity ?? "needs-review"}</p>
                {entry.uses?.length ? <p>Uses: {entry.uses.join(", ")}</p> : null}
                {showProof ? <ProofList proof={entry.proof} /> : null}
                {showBlockers && entry.blockers?.length ? (
                  <ul>
                    {entry.blockers.slice(0, 4).map((blocker) => <li key={blocker}>{blocker}</li>)}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProofList({ proof }: { proof?: Proof }) {
  const entries = [
    ["live proof", proof?.live],
    ["deployment proof", proof?.deployed],
    ["verification proof", proof?.verified],
    ["QStorage proof", proof?.qstorageVerified],
    ["CasterCloud proof", proof?.castercloudVerified],
    ["security review", proof?.securityReviewed]
  ];
  return (
    <div>
      <p>Proof:</p>
      <ul>
        {entries.map(([label, value]) => <li key={String(label)}>{label}: {value ? "present" : "required"}</li>)}
      </ul>
      {proof?.evidence?.length ? (
        <p>Evidence: <code>{proof.evidence[0]}</code></p>
      ) : null}
    </div>
  );
}

function groupByCategory(entries: EcosystemDirectoryEntry[]): Record<string, EcosystemDirectoryEntry[]> {
  return entries.reduce<Record<string, EcosystemDirectoryEntry[]>>((acc, entry) => {
    const category = entry.category || "Unknown";
    acc[category] ??= [];
    acc[category].push(safeEntry(entry));
    return acc;
  }, {});
}

function safeEntry(entry: EcosystemDirectoryEntry): EcosystemDirectoryEntry {
  return {
    ...entry,
    proof: {
      ...entry.proof,
      live: false,
      deployed: false,
      verified: false
    },
    safety: {
      ...entry.safety,
      runtimeStatePublic: false,
      secretsExposed: false,
      imagesBundled: false,
      redacted: true
    }
  };
}

function statusForPill(status: string): GitCasterTruthStatus {
  if (status === "alpha-local") return "alpha-local";
  if (status === "proof-only" || status === "template-candidate" || status === "index-only") return "proof-only";
  if (status === "requires-endpoint" || status === "requires-api-contract" || status === "requires-verification-proof") return "requires-endpoint";
  if (status === "requires-contract") return "requires-contract";
  if (status === "requires-audit") return "requires-audit";
  if (status === "requires-governance") return "requires-governance";
  if (status === "requires-registry") return "requires-registry";
  if (status === "legacy-reference") return "legacy-reference";
  if (status === "blocked" || status === "rejected" || status === "error" || status === "sensitive" || status === "secret-risk" || status === "needs-review") return "blocked";
  return "preview";
}

function hasStrongProof(proof?: Proof): boolean {
  return Boolean(proof?.evidence?.length && (proof.live || proof.deployed || proof.verified));
}

function firstEvidence(proof?: Proof): string | undefined {
  return proof?.evidence?.[0];
}
