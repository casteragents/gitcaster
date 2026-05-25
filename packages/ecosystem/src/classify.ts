import type { GitCasterEcosystemCategory, GitCasterEcosystemSensitivity, GitCasterEcosystemStatus } from "./canonical-manifest.js";
import { classifyLegacyPlatform } from "./legacy-platform-detect.js";
import { classifySensitivePath } from "./sensitive-files.js";

export type EcosystemClassification = {
  id: string;
  name: string;
  category: GitCasterEcosystemCategory;
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
  publicDescription: string;
  blockers: string[];
  evidence: string[];
};

export function canonicalIdForName(name: string): string {
  return name.toLowerCase().replace(/\$/g, "caster").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categoryForKnownProject(nameOrPath: string): GitCasterEcosystemCategory {
  const value = nameOrPath.toLowerCase();
  if (value.includes("claim") || value.includes("miniapp")) return "Miniapps";
  if (value.includes("agent") || value.includes("casterai") || value.includes("casterapp")) return "Agents";
  if (value.includes("punk")) return "Collectibles";
  if (value.includes("xgames") || value.includes("games")) return "Games";
  if (value.includes("qstorage")) return "Storage";
  if (value.includes("cloud")) return "CasterCloud deployments";
  if (value.includes("wallet") || value.includes("security") || value.includes("guard")) return "Security";
  if (value.includes("token") || value.includes("$caster")) return "Token";
  if (value.includes("studio") || value.includes("proof") || value.includes("release")) return "Proof / evidence";
  if (value.includes("intelligence")) return "Builder tools";
  if (value.includes("a1")) return "Desktop / local runtime";
  if (value.includes("farcaster") || value.includes("tapcaster")) return "Social / Farcaster";
  if (value.includes("gitcaster")) return "Protocol";
  if (value.includes("casterchain")) return "Infrastructure";
  return "Unknown";
}

export function statusForKnownProject(nameOrPath: string): GitCasterEcosystemStatus {
  const value = nameOrPath.toLowerCase();
  if (value.includes("$caster")) return "proof-only";
  if (value.includes("gitcaster")) return "alpha-local";
  if (value.includes("vercel.json") || classifyLegacyPlatform(value) === "legacy-reference") return "legacy-reference";
  if (value.includes("domain")) return "requires-registry";
  if (value.includes("contract")) return "requires-contract";
  return "preview";
}

export function publicDescriptionForKnownProject(nameOrPath: string): string {
  const value = nameOrPath.toLowerCase();
  if (value.includes("claim")) return "First miniapp migration target for PR-14; listed here without migration.";
  if (value.includes("agents")) return "Agent workspace listed with sensitive runtime state redacted until safety review.";
  if (value.includes("punk")) return "Collectibles surface listed index-only until PR-15.";
  if (value.includes("$caster")) return "$CASTER token surface listed as proof-only until contract, audit, and governance evidence exists.";
  if (value.includes("qstorage")) return "QStorage tool surface listed as endpoint-gated.";
  if (value.includes("cloud")) return "CasterCloud tool surface listed as endpoint-gated.";
  return "Canonical GitCaster ecosystem entry with preview status until evidence exists.";
}

export function classifyKnownCasterProject(nameOrPath: string): EcosystemClassification {
  const value = nameOrPath.toLowerCase();
  const sensitive = classifySensitivePath(nameOrPath);
  let sensitivity: GitCasterEcosystemSensitivity = "public";
  if (sensitive === "sensitive-runtime-state") sensitivity = "sensitive";
  if (sensitive === "secret-risk") sensitivity = "secret-risk";
  if (value.includes("agents")) sensitivity = "sensitive";
  if (value.includes("casterai") || value.includes("casterapp") || value.includes("tapcaster")) sensitivity = "secret-risk";
  if (value.includes("intelligence") || value.includes("caster-a1") || value.includes("studio")) sensitivity = "needs-review";
  if (value.includes("vercel.json")) sensitivity = "legacy-reference";

  const category = categoryForKnownProject(nameOrPath);
  const status = value.includes("agents") || value.includes("casterai") || value.includes("casterapp") || value.includes("tapcaster")
    ? "needs-review"
    : statusForKnownProject(nameOrPath);
  return {
    id: canonicalIdForName(nameOrPath),
    name: nameOrPath,
    category,
    sensitivity,
    status,
    repoStatus: value.includes("gitcaster") ? "alpha-local" : value.includes("not-found") ? "not-applicable" : "not-imported",
    deployStatus: value.includes("qstorage") || value.includes("cloud") || value.includes("claim") ? "requires-endpoint" : "blocked",
    qstorageStatus: value.includes("qstorage") || value.includes("punk") ? "requires-endpoint" : "not-applicable",
    castercloudStatus: value.includes("cloud") || value.includes("claim") ? "requires-endpoint" : "not-applicable",
    miniappCompatible: value.includes("claim") || value.includes("miniapp") ? true : null,
    farcasterCompatible: value.includes("claim") || value.includes("miniapp") || value.includes("farcaster") || value.includes("tapcaster") ? true : null,
    gameCompatible: value.includes("xgames") || value.includes("games") ? true : null,
    tokenHooks: value.includes("$caster") ? ["proof-only"] : [],
    agents: value.includes("agent") ? ["needs-review"] : [],
    publicDescription: publicDescriptionForKnownProject(nameOrPath),
    blockers: ["Evidence required before stronger status."],
    evidence: []
  };
}

export function classifyPath(inputPath: string): EcosystemClassification {
  return classifyKnownCasterProject(inputPath);
}
