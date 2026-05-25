import { createHash } from "node:crypto";

export type GitCasterEcosystemCategory =
  | "Agents"
  | "Miniapps"
  | "Games"
  | "Infrastructure"
  | "Builder tools"
  | "Finance"
  | "Models"
  | "Identity"
  | "Storage"
  | "Social / Farcaster"
  | "CasterCloud deployments"
  | "Collectibles"
  | "Proof / evidence"
  | "Security"
  | "Desktop / local runtime"
  | "Token"
  | "Domains"
  | "Protocol"
  | "Unknown";

export type GitCasterEcosystemSensitivity = "public" | "sensitive" | "needs-review" | "secret-risk" | "legacy-reference";
export type GitCasterEcosystemStatus =
  | "preview"
  | "alpha-local"
  | "blocked"
  | "proof-only"
  | "requires-endpoint"
  | "requires-contract"
  | "requires-audit"
  | "requires-registry"
  | "needs-review"
  | "legacy-reference"
  | "unknown";

export type GitCasterEcosystemEntry = {
  type: "gitcaster.ecosystem.entry.v1";
  id: string;
  name: string;
  category: GitCasterEcosystemCategory;
  sourcePath: string;
  sensitivity: GitCasterEcosystemSensitivity;
  status: GitCasterEcosystemStatus;
  repoStatus: "not-imported" | "imported" | "blocked" | "needs-review" | "not-applicable" | "alpha-local";
  deployStatus: "not-deployed" | "castercloud-ready" | "needs-qstorage-proof" | "blocked" | "not-applicable" | "requires-endpoint";
  qstorageStatus: "missing" | "blocked" | "requires-endpoint" | "verified" | "not-applicable";
  castercloudStatus: "missing" | "blocked" | "requires-endpoint" | "verified" | "not-applicable";
  miniappCompatible: boolean | null;
  farcasterCompatible: boolean | null;
  gameCompatible: boolean | null;
  tokenHooks: string[];
  agents: string[];
  evidence: string[];
  blockers: string[];
  publicDescription: string;
  privateNotesRedacted: true;
};

export type GitCasterCanonicalEcosystemManifest = {
  type: "gitcaster.ecosystem.canonical-manifest.v1";
  status: "preview";
  createdAt: string;
  product: "GitCaster";
  entries: GitCasterEcosystemEntry[];
  summary: Record<string, unknown>;
  rootHash: string;
  notes: string[];
};

export function createEcosystemEntry(args: Omit<GitCasterEcosystemEntry, "type" | "privateNotesRedacted">): GitCasterEcosystemEntry {
  return {
    type: "gitcaster.ecosystem.entry.v1",
    privateNotesRedacted: true,
    ...args
  };
}

export function redactPrivateNotes(entry: GitCasterEcosystemEntry): GitCasterEcosystemEntry {
  return { ...entry, privateNotesRedacted: true };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stable(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function manifestRootHash(manifest: Omit<GitCasterCanonicalEcosystemManifest, "rootHash"> | GitCasterCanonicalEcosystemManifest): string {
  const clone = { ...manifest, rootHash: undefined };
  return `sha256:${createHash("sha256").update(stable(clone)).digest("hex")}`;
}

export function createCanonicalEcosystemManifest(args: {
  createdAt?: string;
  entries: GitCasterEcosystemEntry[];
  summary?: Record<string, unknown>;
}): GitCasterCanonicalEcosystemManifest {
  const withoutHash = {
    type: "gitcaster.ecosystem.canonical-manifest.v1" as const,
    status: "preview" as const,
    createdAt: args.createdAt ?? new Date().toISOString(),
    product: "GitCaster" as const,
    entries: args.entries.map(redactPrivateNotes),
    summary: args.summary ?? {},
    notes: [
      "Sensitive runtime state is redacted.",
      "Caster Punks are index-only until PR-15.",
      "Caster Claim Miniapp migration is PR-14."
    ]
  };
  return { ...withoutHash, rootHash: manifestRootHash(withoutHash) };
}

export function validateCanonicalEcosystemManifest(manifest: GitCasterCanonicalEcosystemManifest): string[] {
  const blockers: string[] = [];
  if (manifest.type !== "gitcaster.ecosystem.canonical-manifest.v1") blockers.push("invalid manifest type");
  if (manifest.product !== "GitCaster") blockers.push("manifest product must be GitCaster");
  if (manifest.status !== "preview") blockers.push("manifest status must be preview");
  for (const entry of manifest.entries) {
    for (const key of [
      "id",
      "name",
      "category",
      "sourcePath",
      "sensitivity",
      "status",
      "repoStatus",
      "deployStatus",
      "qstorageStatus",
      "castercloudStatus",
      "miniappCompatible",
      "farcasterCompatible",
      "gameCompatible",
      "tokenHooks",
      "agents",
      "evidence",
      "blockers",
      "publicDescription",
      "privateNotesRedacted"
    ] as const) {
      if (!(key in entry)) blockers.push(`${entry.name} missing ${key}`);
    }
    if (["live", "verified", "deployed", "production", "mapped", "replicated"].includes(entry.status)) blockers.push(`${entry.name} has forbidden status`);
    if (entry.privateNotesRedacted !== true) blockers.push(`${entry.name} private notes must be redacted`);
  }
  return blockers;
}
