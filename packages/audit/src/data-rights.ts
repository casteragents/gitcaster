import { createHash } from "node:crypto";

export type GitCasterDataRightsStatus =
  | "allowed-for-index"
  | "allowed-for-public"
  | "rights-review-required"
  | "counsel-required"
  | "blocked-private"
  | "blocked-sensitive"
  | "attribution-required"
  | "provenance-required"
  | "unknown"
  | "not-applicable";

export type GitCasterDataRightsRisk = "low" | "medium" | "high" | "critical" | "unknown";
export type GitCasterDataAssetKind =
  | "source-code"
  | "public-image"
  | "icon"
  | "splash"
  | "screenshot"
  | "vendor-js"
  | "runtime-state"
  | "pending-social-content"
  | "rankings-balances"
  | "tipping-rewards"
  | "model-output"
  | "bot-script"
  | "claim-miniapp-asset"
  | "caster-punks-image"
  | "caster-intelligence-asset"
  | "ecosystem-submission"
  | "token-copy"
  | "domain-copy"
  | "legal-copy"
  | "unknown";

export type GitCasterDataRightsItem = {
  type: "gitcaster.audit.data-rights-item.v1";
  path: string;
  kind: GitCasterDataAssetKind;
  status: GitCasterDataRightsStatus;
  risk: GitCasterDataRightsRisk;
  publicUseAllowed: boolean;
  indexOnlyAllowed: boolean;
  evidence: string[];
  blockers: string[];
};

export type GitCasterDataRightsReview = {
  type: "gitcaster.audit.data-rights-review.v1";
  status: "passed" | "blocked" | "manual-required" | "rights-review-required" | "counsel-required" | "failed";
  createdAt: string;
  items: GitCasterDataRightsItem[];
  summary: Record<string, number>;
  rootHash: string;
  dataRightsClearedClaimed: false;
  canShipProduction: false;
};

export function classifyDataRightsPath(inputPath: string): GitCasterDataAssetKind {
  const value = inputPath.replace(/\\/g, "/").toLowerCase();
  if (/balances|ranking|processed|pending-posts|pending-replies|tipping|reward/.test(value)) return value.includes("pending") ? "pending-social-content" : value.includes("tip") || value.includes("reward") ? "tipping-rewards" : "rankings-balances";
  if (value.includes("casteragents")) return "runtime-state";
  if (value.includes("caster-punks") && /\.(png|jpg|jpeg|webp|gif)$/i.test(value)) return "caster-punks-image";
  if (value.includes("caster-claim-miniapp")) return "claim-miniapp-asset";
  if (value.includes("caster intelligence")) return "caster-intelligence-asset";
  if (value.includes("openai") || value.includes("farcaster") || value.includes("hypersnap")) return "bot-script";
  if (value.includes("token") || value.includes("staking") || value.includes("governance")) return "token-copy";
  if (value.includes("domain") || value.includes(".caster")) return "domain-copy";
  if (value.includes("legal") || value.includes("terms") || value.includes("privacy")) return "legal-copy";
  if (value.includes("vendor") || value.endsWith(".min.js")) return "vendor-js";
  if (/\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(value)) return "public-image";
  if (/\.(ts|tsx|js|mjs|cjs|py|rs|sol)$/i.test(value)) return "source-code";
  return "unknown";
}

export function createDataRightsItem(args: Omit<GitCasterDataRightsItem, "type">): GitCasterDataRightsItem {
  return {
    type: "gitcaster.audit.data-rights-item.v1",
    ...args,
    path: redactPath(args.path),
    publicUseAllowed: args.publicUseAllowed && args.status === "allowed-for-public"
  };
}

export function evaluateDataRightsItem(item: Pick<GitCasterDataRightsItem, "path" | "kind">): GitCasterDataRightsItem {
  const kind = item.kind;
  if (kind === "runtime-state") return createDataRightsItem({ path: item.path, kind, status: "blocked-private", risk: "critical", publicUseAllowed: false, indexOnlyAllowed: false, evidence: [], blockers: ["runtime state is private"] });
  if (kind === "pending-social-content" || kind === "rankings-balances" || kind === "tipping-rewards") return createDataRightsItem({ path: item.path, kind, status: "blocked-sensitive", risk: "critical", publicUseAllowed: false, indexOnlyAllowed: false, evidence: [], blockers: ["sensitive social/economic state"] });
  if (kind === "caster-punks-image") return createDataRightsItem({ path: item.path, kind, status: "rights-review-required", risk: "high", publicUseAllowed: false, indexOnlyAllowed: true, evidence: [], blockers: ["image rights review required"] });
  if (kind === "claim-miniapp-asset" || kind === "caster-intelligence-asset" || kind === "public-image" || kind === "vendor-js") return createDataRightsItem({ path: item.path, kind, status: "provenance-required", risk: "medium", publicUseAllowed: false, indexOnlyAllowed: true, evidence: [], blockers: ["provenance evidence required"] });
  if (kind === "token-copy" || kind === "domain-copy" || kind === "legal-copy") return createDataRightsItem({ path: item.path, kind, status: "counsel-required", risk: "high", publicUseAllowed: false, indexOnlyAllowed: false, evidence: [], blockers: ["counsel review required"] });
  if (kind === "bot-script") return createDataRightsItem({ path: item.path, kind, status: "rights-review-required", risk: "high", publicUseAllowed: false, indexOnlyAllowed: false, evidence: [], blockers: ["integration review required"] });
  return createDataRightsItem({ path: item.path, kind, status: "not-applicable", risk: "low", publicUseAllowed: false, indexOnlyAllowed: true, evidence: [], blockers: [] });
}

export function createDataRightsReview(args: { paths: string[]; createdAt?: string }): GitCasterDataRightsReview {
  const items = args.paths.map((inputPath) => evaluateDataRightsItem({ path: inputPath, kind: classifyDataRightsPath(inputPath) }));
  const summary = summarizeDataRightsReview({ items });
  const review = {
    type: "gitcaster.audit.data-rights-review.v1" as const,
    status: summary.blockedSensitive > 0 || summary.blockedPrivate > 0 ? "blocked" as const : summary.counselRequired > 0 ? "counsel-required" as const : summary.rightsReviewRequired > 0 ? "rights-review-required" as const : "passed" as const,
    createdAt: args.createdAt ?? new Date().toISOString(),
    items,
    summary,
    dataRightsClearedClaimed: false as const,
    canShipProduction: false as const
  };
  return { ...review, rootHash: dataRightsReviewRootHash(review) };
}

export function summarizeDataRightsReview(review: Pick<GitCasterDataRightsReview, "items">): Record<string, number> {
  return {
    itemsTotal: review.items.length,
    blockedSensitive: review.items.filter((item) => item.status === "blocked-sensitive").length,
    blockedPrivate: review.items.filter((item) => item.status === "blocked-private").length,
    rightsReviewRequired: review.items.filter((item) => item.status === "rights-review-required" || item.status === "provenance-required").length,
    counselRequired: review.items.filter((item) => item.status === "counsel-required").length,
    indexOnlyAllowed: review.items.filter((item) => item.indexOnlyAllowed).length,
    publicUseAllowed: review.items.filter((item) => item.publicUseAllowed).length
  };
}

export function dataRightsReviewRootHash(review: Omit<GitCasterDataRightsReview, "rootHash"> | GitCasterDataRightsReview): string {
  return `sha256:${createHash("sha256").update(JSON.stringify({ ...review, rootHash: undefined })).digest("hex")}`;
}

export function redactDataRightsReview(review: GitCasterDataRightsReview): GitCasterDataRightsReview {
  const redacted = { ...review, items: review.items.map((item) => ({ ...item, path: redactPath(item.path) })), dataRightsClearedClaimed: false as const, canShipProduction: false as const };
  return { ...redacted, rootHash: dataRightsReviewRootHash(redacted) };
}

function redactPath(inputPath: string): string {
  return /balances|ranking|processed|pending|tipping|reward|runtime-state/i.test(inputPath) ? "[redacted-sensitive-path]" : inputPath;
}
