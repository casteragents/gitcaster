import type { GitCasterCanonicalEcosystemManifest, GitCasterEcosystemEntry } from "./canonical-manifest.js";
import {
  appDirectoryRootHash,
  createAppDirectory,
  createAppDirectoryEntry,
  redactAppDirectoryEntry,
  validateAppDirectory,
  type GitCasterAppDirectory,
  type GitCasterAppDirectoryCategory,
  type GitCasterAppDirectoryEntry,
  type GitCasterAppDirectoryStatus
} from "./app-directory.js";

export type GitCasterEcosystemRcVerdict = "ecosystem-rc-ready" | "ecosystem-rc-blocked" | "preview-only" | "failed";

export type GitCasterEcosystemRcManifest = {
  type: "gitcaster.ecosystem.rc-manifest.v1";
  status: GitCasterEcosystemRcVerdict;
  createdAt: string;
  directoryPath: string;
  canonicalManifestPath: string;
  entriesTotal: number;
  directoryRootHash: string;
  blockers: string[];
  canShipProduction: false;
};

export function deriveRcEntriesFromCanonicalManifest(canonical: GitCasterCanonicalEcosystemManifest): GitCasterAppDirectoryEntry[] {
  return canonical.entries.map((entry) => createRcEntryFromCanonical(entry, canonical.createdAt));
}

export function createEcosystemRcManifest(args: {
  canonical?: GitCasterCanonicalEcosystemManifest | null;
  directory?: GitCasterAppDirectory | null;
  createdAt?: string;
  directoryPath?: string;
  canonicalManifestPath?: string;
  blockers?: string[];
}): GitCasterEcosystemRcManifest {
  const blockers = [...(args.blockers ?? [])];
  if (!args.canonical) blockers.push("Canonical manifest is required.");
  if (!args.directory) blockers.push("RC directory is required.");
  if (args.directory) blockers.push(...validateAppDirectory(args.directory));
  const status = evaluateEcosystemRcReadiness({
    canonicalFound: Boolean(args.canonical),
    directory: args.directory ?? null,
    blockers
  });
  return {
    type: "gitcaster.ecosystem.rc-manifest.v1",
    status,
    createdAt: args.createdAt ?? new Date().toISOString(),
    directoryPath: args.directoryPath ?? "apps/web/public/gitcaster-ecosystem.rc.json",
    canonicalManifestPath: args.canonicalManifestPath ?? "apps/web/public/gitcaster-ecosystem.canonical.json",
    entriesTotal: args.directory?.entries.length ?? 0,
    directoryRootHash: args.directory?.rootHash ?? "sha256:missing",
    blockers: [...new Set(blockers)].sort(),
    canShipProduction: false
  };
}

export function evaluateEcosystemRcReadiness(args: {
  canonicalFound?: boolean;
  directory?: GitCasterAppDirectory | null;
  blockers?: string[];
} | GitCasterEcosystemRcManifest): GitCasterEcosystemRcVerdict {
  if ("type" in args) {
    if (args.blockers.some((blocker) => /secret|runtime state public|fake|invalid/i.test(blocker))) return "failed";
    if (args.blockers.length > 0) return "preview-only";
    return args.status;
  }
  if (!args.canonicalFound) return "ecosystem-rc-blocked";
  const blockers = args.blockers ?? [];
  if (blockers.some((blocker) => /secret|runtime state public|image.*bundled|fake live|invalid json/i.test(blocker))) return "failed";
  if (blockers.length > 0) return "preview-only";
  const directory = args.directory;
  if (!directory) return "ecosystem-rc-blocked";
  if (directory.entries.some((entry) => entry.safety.secretsExposed || entry.safety.runtimeStatePublic || entry.safety.imagesBundled)) return "failed";
  if (directory.entries.some((entry) => entry.proof.live || entry.proof.deployed || entry.proof.verified)) return "preview-only";
  return "ecosystem-rc-ready";
}

export function ecosystemRcRootHash(manifest: GitCasterEcosystemRcManifest): string {
  return appDirectoryRootHash({
    type: "gitcaster.ecosystem.app-directory.v1",
    status: "preview",
    createdAt: manifest.createdAt,
    product: "GitCaster",
    entries: [],
    summary: {
      entriesTotal: manifest.entriesTotal,
      featured: 0,
      live: 0,
      needsReview: 0,
      blocked: manifest.blockers.length,
      sensitive: 0,
      secretRisk: 0
    },
    canShipProduction: false,
    notes: manifest.blockers
  });
}

export function redactEcosystemRcManifest(manifest: GitCasterEcosystemRcManifest): GitCasterEcosystemRcManifest {
  return {
    ...manifest,
    blockers: manifest.blockers.map((blocker) => blocker.replace(/(secret|token|key)=\S+/gi, "$1=[redacted]")),
    canShipProduction: false
  };
}

export function createRcDirectoryFromCanonical(canonical: GitCasterCanonicalEcosystemManifest): GitCasterAppDirectory {
  return createAppDirectory({
    createdAt: canonical.createdAt,
    entries: deriveRcEntriesFromCanonicalManifest(canonical),
    notes: [
      "RC directory is proof-aware.",
      "Listings are not approval.",
      "Live/deployed/verified labels require evidence."
    ]
  });
}

function createRcEntryFromCanonical(entry: GitCasterEcosystemEntry, createdAt: string): GitCasterAppDirectoryEntry {
  const nameKey = `${entry.id} ${entry.name} ${entry.sourcePath}`.toLowerCase();
  const special = specialStatus(nameKey);
  const status = special.status ?? normalizeStatus(entry.status, entry.category);
  const sensitivity = special.sensitivity ?? entry.sensitivity;
  const category = normalizeCategory(entry.category);
  const proof = {
    live: false,
    deployed: false,
    verified: false,
    qstorageVerified: false,
    castercloudVerified: false,
    securityReviewed: false,
    evidence: sanitizeEvidence(entry.evidence)
  };
  const blockers = new Set(entry.blockers.length > 0 ? entry.blockers : ["Evidence required before stronger status."]);
  if (special.blocker) blockers.add(special.blocker);
  if (category === "Token") blockers.add("Contract, audit, and governance proof required.");
  if (category === "Domains") blockers.add("Registry proof required.");
  if (entry.qstorageStatus === "requires-endpoint" || entry.castercloudStatus === "requires-endpoint") blockers.add("CasterCloud/QStorage verification required before stronger claims.");

  return createAppDirectoryEntry({
    id: entry.id,
    name: entry.name,
    category,
    status,
    sourcePath: redactPath(entry.sourcePath),
    builder: "CasterChain",
    builderUrl: null,
    repoUrl: null,
    demoUrl: null,
    description: entry.publicDescription,
    uses: inferUses(entry, category),
    proof,
    safety: {
      sensitivity,
      runtimeStatePublic: false,
      secretsExposed: false,
      imagesBundled: false,
      redacted: true
    },
    badges: [],
    blockers: [...blockers],
    createdAt,
    updatedAt: createdAt
  });
}

function normalizeCategory(category: string): GitCasterAppDirectoryCategory {
  if (category === "Desktop / local runtime") return "Local runtime";
  if (category === "Social / Farcaster") return "Integrations";
  if (category === "Identity" || category === "Protocol") return "Infrastructure";
  const allowed = new Set<GitCasterAppDirectoryCategory>([
    "Agents",
    "Builder tools",
    "Miniapps",
    "Games",
    "Infrastructure",
    "Integrations",
    "Finance",
    "Models",
    "Collectibles",
    "Storage",
    "CasterCloud deployments",
    "Security",
    "Domains",
    "Token",
    "Proof / evidence",
    "Local runtime",
    "Unknown"
  ]);
  return allowed.has(category as GitCasterAppDirectoryCategory) ? (category as GitCasterAppDirectoryCategory) : "Unknown";
}

function normalizeStatus(status: string, category: string): GitCasterAppDirectoryStatus {
  if (category === "Token") return "proof-only";
  if (category === "Domains") return "requires-registry";
  if (status === "unknown") return "needs-review";
  const allowed = new Set<GitCasterAppDirectoryStatus>([
    "alpha-local",
    "preview",
    "proof-only",
    "blocked",
    "planned",
    "submitted",
    "needs-review",
    "secret-risk",
    "sensitive",
    "index-only",
    "template-candidate",
    "requires-endpoint",
    "requires-api-contract",
    "requires-verification-proof",
    "requires-node",
    "requires-health-proof",
    "requires-federation-proof",
    "requires-signature",
    "requires-registry",
    "requires-contract",
    "requires-audit",
    "requires-governance",
    "legacy-reference",
    "rejected",
    "error"
  ]);
  return allowed.has(status as GitCasterAppDirectoryStatus) ? (status as GitCasterAppDirectoryStatus) : "needs-review";
}

function specialStatus(nameKey: string): {
  status?: GitCasterAppDirectoryStatus;
  sensitivity?: "public" | "needs-review" | "sensitive" | "secret-risk" | "legacy-reference";
  blocker?: string;
} {
  if (nameKey.includes("caster-claim-miniapp") || nameKey.includes("claim miniapp")) {
    return { status: "template-candidate", sensitivity: "public", blocker: "Deployment proof required before live or deployed labels." };
  }
  if (nameKey.includes("caster-punks") || nameKey.includes("punk")) {
    return { status: "index-only", sensitivity: "public", blocker: "Publish proof required before image or collection availability claims." };
  }
  if (nameKey.includes("casteragents")) {
    return { status: "needs-review", sensitivity: "sensitive", blocker: "Sensitive runtime state remains redacted." };
  }
  if (nameKey.includes("casterai") || nameKey.includes("casterapp") || nameKey.includes("tapcaster")) {
    return { status: "needs-review", sensitivity: "secret-risk", blocker: "Agent/API code requires review before public claims." };
  }
  return {};
}

function inferUses(entry: GitCasterEcosystemEntry, category: GitCasterAppDirectoryCategory): string[] {
  const uses = new Set(["GitCaster"]);
  if (category === "Storage" || entry.qstorageStatus !== "not-applicable") uses.add("QStorage");
  if (category === "CasterCloud deployments" || entry.castercloudStatus !== "not-applicable") uses.add("CasterCloud");
  if (entry.farcasterCompatible) uses.add("Farcaster");
  if (entry.miniappCompatible) uses.add("Miniapps");
  return [...uses].sort();
}

function sanitizeEvidence(evidence: string[]): string[] {
  return evidence.map(redactPath).filter(Boolean);
}

function redactPath(path: string): string {
  if (/balances|ranking|processed|pending|tips|token|secret|private/i.test(path)) return "[redacted-sensitive-path]";
  return path;
}
