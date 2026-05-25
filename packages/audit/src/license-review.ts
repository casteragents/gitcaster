import { createHash } from "node:crypto";
import type { GitCasterThirdPartyItem } from "./third-party-inventory.js";

export type GitCasterLicenseStatus = "allowed" | "attribution-required" | "review-required" | "counsel-required" | "blocked" | "unknown" | "not-applicable";
export type GitCasterLicenseRisk = "low" | "medium" | "high" | "critical" | "unknown";

export type GitCasterLicensePolicy = {
  type: "gitcaster.audit.license-policy.v1";
  permissive: string[];
  counselRequired: string[];
  blocked: string[];
  legalClearanceClaimed: false;
};

export type GitCasterLicenseReviewItem = {
  type: "gitcaster.audit.license-review-item.v1";
  path: string;
  license: string | null;
  status: GitCasterLicenseStatus;
  risk: GitCasterLicenseRisk;
  attributionRequired: boolean;
  counselRequired: boolean;
  reason: string;
  evidence: string[];
  blockers: string[];
};

export type GitCasterLicenseReview = {
  type: "gitcaster.audit.license-review.v1";
  status: "passed" | "blocked" | "manual-required" | "counsel-required" | "failed";
  createdAt: string;
  policy: GitCasterLicensePolicy;
  items: GitCasterLicenseReviewItem[];
  summary: Record<string, number>;
  rootHash: string;
  legalClearanceClaimed: false;
  canShipProduction: false;
};

export function createDefaultLicensePolicy(): GitCasterLicensePolicy {
  return {
    type: "gitcaster.audit.license-policy.v1",
    permissive: ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"],
    counselRequired: ["GPL", "AGPL", "LGPL", "SSPL", "proprietary"],
    blocked: ["no-license"],
    legalClearanceClaimed: false
  };
}

export function createLicenseReviewItem(args: Omit<GitCasterLicenseReviewItem, "type">): GitCasterLicenseReviewItem {
  return { type: "gitcaster.audit.license-review-item.v1", ...args };
}

export function evaluateLicensePolicy(item: Pick<GitCasterThirdPartyItem, "path" | "license" | "kind" | "status" | "attributionRequired" | "rightsReviewRequired">, policy = createDefaultLicensePolicy()): GitCasterLicenseReviewItem {
  const license = item.license;
  if (item.kind === "casteragents-runtime-state") return createLicenseReviewItem({ path: item.path, license, status: "blocked", risk: "critical", attributionRequired: false, counselRequired: true, reason: "Sensitive runtime state is blocked from public release.", evidence: [], blockers: ["private runtime state"] });
  if (item.kind === "caster-punks-image-corpus") return createLicenseReviewItem({ path: item.path, license, status: "review-required", risk: "high", attributionRequired: false, counselRequired: false, reason: "Image corpus requires rights review before publication.", evidence: [], blockers: ["rights review required"] });
  if (!license) return createLicenseReviewItem({ path: item.path, license, status: "review-required", risk: "medium", attributionRequired: item.attributionRequired, counselRequired: false, reason: "License metadata is missing or unknown.", evidence: [], blockers: ["license review required"] });
  if (policy.permissive.includes(license)) return createLicenseReviewItem({ path: item.path, license, status: "attribution-required", risk: "low", attributionRequired: true, counselRequired: false, reason: "Permissive license still needs attribution tracking.", evidence: [], blockers: [] });
  if (policy.counselRequired.some((name) => license.includes(name))) return createLicenseReviewItem({ path: item.path, license, status: "counsel-required", risk: "high", attributionRequired: true, counselRequired: true, reason: "Copyleft/proprietary license requires counsel review.", evidence: [], blockers: ["counsel review required"] });
  return createLicenseReviewItem({ path: item.path, license, status: "unknown", risk: "unknown", attributionRequired: item.attributionRequired, counselRequired: false, reason: "License is not in default policy.", evidence: [], blockers: ["manual review required"] });
}

export function createLicenseReview(args: { items: GitCasterThirdPartyItem[]; createdAt?: string; policy?: GitCasterLicensePolicy }): GitCasterLicenseReview {
  const policy = args.policy ?? createDefaultLicensePolicy();
  const items = args.items.map((item) => evaluateLicensePolicy(item, policy));
  const summary = summarizeLicenseReview({ items });
  const review = {
    type: "gitcaster.audit.license-review.v1" as const,
    status: summary.blocked > 0 ? "blocked" as const : summary.counselRequired > 0 ? "counsel-required" as const : summary.reviewRequired > 0 || summary.unknown > 0 ? "manual-required" as const : "passed" as const,
    createdAt: args.createdAt ?? new Date().toISOString(),
    policy,
    items,
    summary,
    legalClearanceClaimed: false as const,
    canShipProduction: false as const
  };
  return { ...review, rootHash: licenseReviewRootHash(review) };
}

export function summarizeLicenseReview(review: Pick<GitCasterLicenseReview, "items">): Record<string, number> {
  return {
    itemsTotal: review.items.length,
    allowed: review.items.filter((item) => item.status === "allowed").length,
    attributionRequired: review.items.filter((item) => item.attributionRequired).length,
    reviewRequired: review.items.filter((item) => item.status === "review-required").length,
    counselRequired: review.items.filter((item) => item.counselRequired || item.status === "counsel-required").length,
    blocked: review.items.filter((item) => item.status === "blocked").length,
    unknown: review.items.filter((item) => item.status === "unknown").length
  };
}

export function licenseReviewRootHash(review: Omit<GitCasterLicenseReview, "rootHash"> | GitCasterLicenseReview): string {
  return `sha256:${createHash("sha256").update(JSON.stringify({ ...review, rootHash: undefined })).digest("hex")}`;
}

export function redactLicenseReview(review: GitCasterLicenseReview): GitCasterLicenseReview {
  return { ...review, legalClearanceClaimed: false, canShipProduction: false, rootHash: licenseReviewRootHash({ ...review, legalClearanceClaimed: false, canShipProduction: false }) };
}
