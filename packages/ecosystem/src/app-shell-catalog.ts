import { createHash } from "node:crypto";
import type { GitCasterAppDirectory, GitCasterAppDirectoryEntry } from "./app-directory.js";

export type GitCasterAppShellKind = "app-shell" | "miniapp-shell" | "index-shell" | "agent-shell" | "tool-shell";
export type GitCasterAppShellStatus = "public-alpha" | "preview" | "proof-only" | "blocked_external" | "needs-review";
export type GitCasterDependencyRiskStatus = "none" | "local-fixture-only" | "legacy-reference" | "blocked_external";

export type GitCasterAppShellDependencyRisk = {
  runtimeApi: GitCasterDependencyRiskStatus;
  nativeStorage: GitCasterDependencyRiskStatus;
  nativeDomain: GitCasterDependencyRiskStatus;
  managedRuntime: GitCasterDependencyRiskStatus;
  legacyHostedPlatform: GitCasterDependencyRiskStatus;
};

export type GitCasterAppShellCatalogEntry = {
  type: "gitcaster.app-shell-catalog.entry.v1";
  id: string;
  name: string;
  kind: GitCasterAppShellKind;
  status: GitCasterAppShellStatus;
  sourcePath: string;
  localPreviewPath: string;
  manifestPath: string | null;
  dependencyRisk: GitCasterAppShellDependencyRisk;
  proof: {
    localFixture: boolean;
    nativeDeployment: false;
    qstoragePublished: false;
    casterDomainMapped: false;
    runtimeEndpointLive: false;
    evidence: string[];
  };
  publicClaims: string[];
  blockedClaims: string[];
  redacted: true;
};

export type GitCasterAppShellCatalog = {
  type: "gitcaster.app-shell-catalog.v1";
  status: "public-alpha";
  product: "GitCaster";
  createdAt: string;
  entries: GitCasterAppShellCatalogEntry[];
  summary: {
    entriesTotal: number;
    miniappShells: number;
    localFixtures: number;
    blockedNativeDeployments: number;
    blockedManagedRuntimes: number;
  };
  canShipProduction: false;
  notes: string[];
  rootHash: string;
};

export function createAppShellCatalogEntry(args: Omit<GitCasterAppShellCatalogEntry, "type" | "redacted">): GitCasterAppShellCatalogEntry {
  return {
    type: "gitcaster.app-shell-catalog.entry.v1",
    ...args,
    proof: {
      ...args.proof,
      nativeDeployment: false,
      qstoragePublished: false,
      casterDomainMapped: false,
      runtimeEndpointLive: false,
      evidence: args.proof.evidence.map(redactValue)
    },
    dependencyRisk: { ...args.dependencyRisk },
    publicClaims: args.publicClaims.map(redactValue),
    blockedClaims: args.blockedClaims.map(redactValue),
    redacted: true
  };
}

export function deriveAppShellEntryFromDirectory(entry: GitCasterAppDirectoryEntry): GitCasterAppShellCatalogEntry | null {
  const kind = shellKind(entry);
  if (!kind) return null;
  const localPreviewPath = entry.id === "caster-claim-miniapp"
    ? "/ecosystem/caster-claim-miniapp"
    : `/ecosystem#${entry.id}`;
  const isMiniapp = kind === "miniapp-shell";
  return createAppShellCatalogEntry({
    id: entry.id,
    name: entry.name,
    kind,
    status: entry.status === "template-candidate" ? "public-alpha" : statusFromDirectory(entry),
    sourcePath: entry.sourcePath,
    localPreviewPath,
    manifestPath: isMiniapp ? "examples/miniapps/caster-claim-miniapp.local-shell.json" : null,
    dependencyRisk: {
      runtimeApi: isMiniapp ? "local-fixture-only" : "blocked_external",
      nativeStorage: "blocked_external",
      nativeDomain: "blocked_external",
      managedRuntime: "blocked_external",
      legacyHostedPlatform: entry.blockers.some((blocker) => /vercel|hosted/i.test(blocker)) ? "legacy-reference" : "none"
    },
    proof: {
      localFixture: isMiniapp,
      nativeDeployment: false,
      qstoragePublished: false,
      casterDomainMapped: false,
      runtimeEndpointLive: false,
      evidence: isMiniapp ? ["examples/miniapps/caster-claim-miniapp.local-shell.json"] : entry.proof.evidence
    },
    publicClaims: isMiniapp
      ? ["local app shell fixture", "manifest shape", "blocked runtime labels"]
      : ["proof-aware catalog listing"],
    blockedClaims: [
      "native .caster deployment",
      "QStorage publication",
      "managed runtime endpoint",
      "production readiness"
    ]
  });
}

export function createAppShellCatalog(args: {
  directory: GitCasterAppDirectory;
  createdAt?: string;
}): GitCasterAppShellCatalog {
  const entries = args.directory.entries
    .map(deriveAppShellEntryFromDirectory)
    .filter((entry): entry is GitCasterAppShellCatalogEntry => Boolean(entry));
  const withoutHash = {
    type: "gitcaster.app-shell-catalog.v1" as const,
    status: "public-alpha" as const,
    product: "GitCaster" as const,
    createdAt: args.createdAt ?? new Date().toISOString(),
    entries,
    summary: {
      entriesTotal: entries.length,
      miniappShells: entries.filter((entry) => entry.kind === "miniapp-shell").length,
      localFixtures: entries.filter((entry) => entry.proof.localFixture).length,
      blockedNativeDeployments: entries.filter((entry) => entry.proof.nativeDeployment === false).length,
      blockedManagedRuntimes: entries.filter((entry) => entry.dependencyRisk.managedRuntime === "blocked_external").length
    },
    canShipProduction: false as const,
    notes: [
      "App shell catalog is public-alpha and proof-aware.",
      "Local previews are not deployment claims.",
      "Native storage, native domain, and managed runtime claims stay blocked until proof exists."
    ]
  };
  return { ...withoutHash, rootHash: appShellCatalogRootHash(withoutHash) };
}

export function validateAppShellCatalog(catalog: GitCasterAppShellCatalog): string[] {
  const blockers: string[] = [];
  if (catalog.type !== "gitcaster.app-shell-catalog.v1") blockers.push("invalid app shell catalog type");
  if (catalog.product !== "GitCaster") blockers.push("app shell catalog product must be GitCaster");
  if (catalog.status !== "public-alpha") blockers.push("app shell catalog status must be public-alpha");
  if (catalog.canShipProduction !== false) blockers.push("app shell catalog cannot ship production");
  if (catalog.rootHash !== appShellCatalogRootHash(catalog)) blockers.push("app shell catalog root hash mismatch");
  for (const entry of catalog.entries) {
    blockers.push(...validateAppShellCatalogEntry(entry));
  }
  return blockers;
}

export function validateAppShellCatalogEntry(entry: GitCasterAppShellCatalogEntry): string[] {
  const blockers: string[] = [];
  if (entry.type !== "gitcaster.app-shell-catalog.entry.v1") blockers.push(`${entry.id} invalid entry type`);
  if (entry.redacted !== true) blockers.push(`${entry.id} must be redacted`);
  if (!entry.localPreviewPath.startsWith("/ecosystem")) blockers.push(`${entry.id} local preview path must stay under /ecosystem`);
  if (entry.proof.nativeDeployment) blockers.push(`${entry.id} cannot claim native deployment`);
  if (entry.proof.qstoragePublished) blockers.push(`${entry.id} cannot claim QStorage publication`);
  if (entry.proof.casterDomainMapped) blockers.push(`${entry.id} cannot claim .caster domain mapping`);
  if (entry.proof.runtimeEndpointLive) blockers.push(`${entry.id} cannot claim live runtime endpoint`);
  if (entry.dependencyRisk.nativeStorage !== "blocked_external") blockers.push(`${entry.id} native storage risk must stay blocked_external`);
  if (entry.dependencyRisk.nativeDomain !== "blocked_external") blockers.push(`${entry.id} native domain risk must stay blocked_external`);
  if (entry.dependencyRisk.managedRuntime !== "blocked_external") blockers.push(`${entry.id} managed runtime risk must stay blocked_external`);
  if (entry.publicClaims.some((claim) => /live|production|deployed|audited|unblocked/i.test(claim))) {
    blockers.push(`${entry.id} public claims include unsupported stronger language`);
  }
  return blockers;
}

export function appShellCatalogRootHash(catalog: Omit<GitCasterAppShellCatalog, "rootHash"> | GitCasterAppShellCatalog): string {
  const clone = { ...catalog, rootHash: undefined };
  return `sha256:${createHash("sha256").update(stable(clone)).digest("hex")}`;
}

function shellKind(entry: GitCasterAppDirectoryEntry): GitCasterAppShellKind | null {
  if (entry.category === "Miniapps" || entry.uses.includes("Miniapps")) return "miniapp-shell";
  if (entry.category === "Games") return "app-shell";
  if (entry.category === "Collectibles") return "index-shell";
  if (entry.category === "Agents") return "agent-shell";
  if (entry.category === "Builder tools" || entry.category === "Integrations") return "tool-shell";
  return null;
}

function statusFromDirectory(entry: GitCasterAppDirectoryEntry): GitCasterAppShellStatus {
  if (entry.status === "proof-only" || entry.status === "index-only") return "proof-only";
  if (entry.status === "needs-review" || entry.status === "sensitive" || entry.status === "secret-risk") return "needs-review";
  if (entry.status === "blocked" || entry.status.startsWith("requires-")) return "blocked_external";
  return "preview";
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

function redactValue(value: string): string {
  return /secret|token=|key=|password|credential/i.test(value) ? "[redacted]" : value;
}
