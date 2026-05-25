import { createHash } from "node:crypto";

export type GitCasterAppDirectoryCategory =
  | "Agents"
  | "Builder tools"
  | "Miniapps"
  | "Games"
  | "Infrastructure"
  | "Integrations"
  | "Finance"
  | "Models"
  | "Collectibles"
  | "Storage"
  | "CasterCloud deployments"
  | "Security"
  | "Domains"
  | "Token"
  | "Proof / evidence"
  | "Local runtime"
  | "Unknown";

export type GitCasterAppDirectoryStatus =
  | "alpha-local"
  | "preview"
  | "proof-only"
  | "blocked"
  | "planned"
  | "submitted"
  | "needs-review"
  | "secret-risk"
  | "sensitive"
  | "index-only"
  | "template-candidate"
  | "requires-endpoint"
  | "requires-api-contract"
  | "requires-verification-proof"
  | "requires-node"
  | "requires-health-proof"
  | "requires-federation-proof"
  | "requires-signature"
  | "requires-registry"
  | "requires-contract"
  | "requires-audit"
  | "requires-governance"
  | "legacy-reference"
  | "rejected"
  | "error";

export type GitCasterAppDirectoryProof = {
  live: boolean;
  deployed: boolean;
  verified: boolean;
  qstorageVerified: boolean;
  castercloudVerified: boolean;
  securityReviewed: boolean;
  evidence: string[];
};

export type GitCasterAppDirectorySafety = {
  sensitivity: "public" | "needs-review" | "sensitive" | "secret-risk" | "legacy-reference";
  runtimeStatePublic: boolean;
  secretsExposed: boolean;
  imagesBundled: boolean;
  redacted: boolean;
};

export type GitCasterAppDirectoryEntry = {
  type: "gitcaster.ecosystem.app-directory.entry.v1";
  id: string;
  name: string;
  category: GitCasterAppDirectoryCategory;
  status: GitCasterAppDirectoryStatus;
  sourcePath: string;
  builder: string;
  builderUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  description: string;
  uses: string[];
  proof: GitCasterAppDirectoryProof;
  safety: GitCasterAppDirectorySafety;
  badges: string[];
  blockers: string[];
  createdAt: string;
  updatedAt: string;
};

export type GitCasterAppDirectorySummary = {
  entriesTotal: number;
  featured: number;
  live: number;
  needsReview: number;
  blocked: number;
  sensitive: number;
  secretRisk: number;
};

export type GitCasterAppDirectory = {
  type: "gitcaster.ecosystem.app-directory.v1";
  status: "preview";
  createdAt: string;
  product: "GitCaster";
  entries: GitCasterAppDirectoryEntry[];
  summary: GitCasterAppDirectorySummary;
  rootHash: string;
  canShipProduction: false;
  notes: string[];
};

export function createAppDirectoryEntry(
  args: Omit<GitCasterAppDirectoryEntry, "type" | "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string }
): GitCasterAppDirectoryEntry {
  const now = args.createdAt ?? new Date().toISOString();
  const proof = { ...args.proof };
  const blockers = new Set(args.blockers);
  if (!proof.live) blockers.add("Live status requires direct evidence.");
  if (!proof.deployed) blockers.add("Deployment status requires CasterCloud/QStorage evidence.");
  if (!proof.verified) blockers.add("Verification status requires review evidence.");
  if (args.status === "requires-contract" || args.category === "Token") blockers.add("Contract, audit, and governance proof required.");
  if (args.status === "requires-registry" || args.category === "Domains") blockers.add("Registry proof required.");

  return {
    type: "gitcaster.ecosystem.app-directory.entry.v1",
    ...args,
    proof,
    safety: { ...args.safety },
    blockers: [...blockers].sort(),
    createdAt: now,
    updatedAt: args.updatedAt ?? now
  };
}

export function summarizeAppDirectory(directory: Pick<GitCasterAppDirectory, "entries">): GitCasterAppDirectorySummary {
  return {
    entriesTotal: directory.entries.length,
    featured: directory.entries.filter((entry) => entry.badges.includes("featured")).length,
    live: directory.entries.filter((entry) => entry.proof.live).length,
    needsReview: directory.entries.filter((entry) => entry.status === "needs-review").length,
    blocked: directory.entries.filter((entry) => entry.status === "blocked" || entry.blockers.length > 0).length,
    sensitive: directory.entries.filter((entry) => entry.safety.sensitivity === "sensitive").length,
    secretRisk: directory.entries.filter((entry) => entry.safety.sensitivity === "secret-risk").length
  };
}

export function createAppDirectory(args: {
  createdAt?: string;
  entries: GitCasterAppDirectoryEntry[];
  notes?: string[];
}): GitCasterAppDirectory {
  const withoutHash = {
    type: "gitcaster.ecosystem.app-directory.v1" as const,
    status: "preview" as const,
    createdAt: args.createdAt ?? new Date().toISOString(),
    product: "GitCaster" as const,
    entries: args.entries.map(redactAppDirectoryEntry),
    summary: summarizeAppDirectory({ entries: args.entries }),
    canShipProduction: false as const,
    notes: args.notes ?? [
      "Directory status is proof-aware.",
      "Live/deployed/verified labels require evidence.",
      "Sensitive runtime state is redacted."
    ]
  };
  return { ...withoutHash, rootHash: appDirectoryRootHash(withoutHash) };
}

export function validateAppDirectoryEntry(entry: GitCasterAppDirectoryEntry): string[] {
  const blockers: string[] = [];
  const required: Array<keyof GitCasterAppDirectoryEntry> = [
    "type",
    "id",
    "name",
    "category",
    "status",
    "sourcePath",
    "builder",
    "description",
    "uses",
    "proof",
    "safety",
    "badges",
    "blockers",
    "createdAt",
    "updatedAt"
  ];
  for (const key of required) {
    if (!(key in entry)) blockers.push(`${entry.id || "entry"} missing ${String(key)}`);
  }
  if (entry.type !== "gitcaster.ecosystem.app-directory.entry.v1") blockers.push(`${entry.id} invalid entry type`);
  if (entry.safety.runtimeStatePublic) blockers.push(`${entry.id} exposes runtime state`);
  if (entry.safety.secretsExposed) blockers.push(`${entry.id} exposes secrets`);
  if (entry.safety.imagesBundled) blockers.push(`${entry.id} bundles protected images`);
  if (entry.status === "rejected" && entry.blockers.length === 0) blockers.push(`${entry.id} rejected entries require reasons`);
  if (entry.proof.live && entry.proof.evidence.length === 0) blockers.push(`${entry.id} live proof requires evidence`);
  if (entry.proof.deployed && !(entry.proof.qstorageVerified || entry.proof.castercloudVerified)) blockers.push(`${entry.id} deployed proof requires CasterCloud/QStorage evidence`);
  if (entry.proof.verified && !entry.proof.securityReviewed && entry.proof.evidence.length === 0) blockers.push(`${entry.id} verified proof requires review evidence`);
  if (entry.status === ("production" as GitCasterAppDirectoryStatus)) blockers.push(`${entry.id} production status is forbidden in PR-28`);
  if (entry.badges.some((badge) => ["featured", "grant-approved", "co-marketing-approved"].includes(badge)) && entry.proof.evidence.length === 0) {
    blockers.push(`${entry.id} approval badge requires review evidence`);
  }
  return blockers;
}

export function validateAppDirectory(directory: GitCasterAppDirectory): string[] {
  const blockers: string[] = [];
  if (directory.type !== "gitcaster.ecosystem.app-directory.v1") blockers.push("invalid directory type");
  if (directory.product !== "GitCaster") blockers.push("directory product must be GitCaster");
  if (directory.canShipProduction !== false) blockers.push("PR-28 directory cannot ship production");
  for (const entry of directory.entries) blockers.push(...validateAppDirectoryEntry(entry));
  if (directory.rootHash !== appDirectoryRootHash(directory)) blockers.push("directory root hash mismatch");
  return blockers;
}

export function appDirectoryRootHash(directory: Omit<GitCasterAppDirectory, "rootHash"> | GitCasterAppDirectory): string {
  const clone = { ...directory, rootHash: undefined };
  return `sha256:${createHash("sha256").update(stable(clone)).digest("hex")}`;
}

export function redactAppDirectoryEntry(entry: GitCasterAppDirectoryEntry): GitCasterAppDirectoryEntry {
  return {
    ...entry,
    builderUrl: entry.builderUrl && looksSensitive(entry.builderUrl) ? null : entry.builderUrl,
    repoUrl: entry.repoUrl && looksSensitive(entry.repoUrl) ? null : entry.repoUrl,
    demoUrl: entry.demoUrl && looksSensitive(entry.demoUrl) ? null : entry.demoUrl,
    proof: {
      ...entry.proof,
      evidence: entry.proof.evidence.map(redactValue)
    },
    safety: {
      ...entry.safety,
      runtimeStatePublic: false,
      secretsExposed: false,
      redacted: true
    },
    blockers: entry.blockers.map(redactValue)
  };
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

function looksSensitive(value: string): boolean {
  return /secret|token|key=|password|credential/i.test(value);
}

function redactValue(value: string): string {
  return looksSensitive(value) ? "[redacted]" : value;
}
