import { createHash } from "node:crypto";

export type GitCasterInventoryKind =
  | "workspace-package"
  | "app-package"
  | "package-manifest"
  | "script"
  | "doc"
  | "public-asset"
  | "vendor-file"
  | "lockfile"
  | "config"
  | "evidence"
  | "ecosystem-app"
  | "casteragents-code"
  | "casteragents-runtime-state"
  | "caster-punks-image-corpus"
  | "claim-miniapp-asset"
  | "sdk-package"
  | "installer"
  | "deployment-script"
  | "unknown";

export type GitCasterInventoryStatus =
  | "inventoried"
  | "source-available"
  | "proprietary-reference"
  | "legacy-reference"
  | "license-known"
  | "license-unknown"
  | "attribution-required"
  | "rights-review-required"
  | "sensitive-private"
  | "blocked"
  | "error";

export type GitCasterThirdPartyItem = {
  type: "gitcaster.audit.third-party-item.v1";
  path: string;
  kind: GitCasterInventoryKind;
  status: GitCasterInventoryStatus;
  name: string;
  packageName: string | null;
  version: string | null;
  license: string | null;
  licenseSource: string | null;
  attributionRequired: boolean;
  rightsReviewRequired: boolean;
  sensitive: boolean;
  publicBundleAllowed: boolean;
  evidence: string[];
  blockers: string[];
};

export type GitCasterThirdPartyInventory = {
  type: "gitcaster.audit.third-party-inventory.v1";
  status: "passed" | "blocked" | "manual-required" | "failed";
  createdAt: string;
  items: GitCasterThirdPartyItem[];
  summary: Record<string, number>;
  rootHash: string;
  canShipProduction: false;
};

export function createThirdPartyItem(args: Omit<GitCasterThirdPartyItem, "type">): GitCasterThirdPartyItem {
  return redactThirdPartyItem({ type: "gitcaster.audit.third-party-item.v1", ...args });
}

export function createThirdPartyInventory(items: GitCasterThirdPartyItem[], createdAt = new Date().toISOString()): GitCasterThirdPartyInventory {
  const inventory = {
    type: "gitcaster.audit.third-party-inventory.v1" as const,
    status: items.some((item) => item.status === "blocked" || item.sensitive) ? "manual-required" as const : "passed" as const,
    createdAt,
    items: items.map(redactThirdPartyItem),
    summary: summarizeThirdPartyInventory({ items }),
    canShipProduction: false as const
  };
  return { ...inventory, rootHash: inventoryRootHash(inventory) };
}

export function summarizeThirdPartyInventory(inventory: Pick<GitCasterThirdPartyInventory, "items">): Record<string, number> {
  return {
    itemsTotal: inventory.items.length,
    packageManifests: inventory.items.filter((item) => item.kind === "package-manifest").length,
    publicAssets: inventory.items.filter((item) => item.kind === "public-asset").length,
    vendorFiles: inventory.items.filter((item) => item.kind === "vendor-file").length,
    rightsReviewRequired: inventory.items.filter((item) => item.rightsReviewRequired).length,
    sensitivePrivate: inventory.items.filter((item) => item.sensitive).length,
    licenseUnknown: inventory.items.filter((item) => item.status === "license-unknown").length
  };
}

export function inventoryRootHash(inventory: Omit<GitCasterThirdPartyInventory, "rootHash"> | GitCasterThirdPartyInventory): string {
  return `sha256:${createHash("sha256").update(stable({ ...inventory, rootHash: undefined })).digest("hex")}`;
}

export function redactThirdPartyItem(item: GitCasterThirdPartyItem): GitCasterThirdPartyItem {
  return {
    ...item,
    path: redactPath(item.path),
    evidence: item.evidence.map(redactPath),
    publicBundleAllowed: item.publicBundleAllowed && !item.sensitive && !item.rightsReviewRequired
  };
}

export function classifyInventoryPath(inputPath: string): { kind: GitCasterInventoryKind; status: GitCasterInventoryStatus; sensitive: boolean; rightsReviewRequired: boolean; attributionRequired: boolean } {
  const value = inputPath.replace(/\\/g, "/").toLowerCase();
  if (value.includes("node_modules") || value.includes("/dist/") || value.includes("/.next/")) return { kind: "unknown", status: "blocked", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.includes("casteragents") && /balances|ranking|processed|pending|tipping|reward|runtime|state/.test(value)) return { kind: "casteragents-runtime-state", status: "sensitive-private", sensitive: true, rightsReviewRequired: true, attributionRequired: false };
  if (value.includes("casteragents")) return { kind: "casteragents-code", status: "rights-review-required", sensitive: false, rightsReviewRequired: true, attributionRequired: false };
  if (value.includes("caster-punks") && /\.(png|jpg|jpeg|webp|gif)$/i.test(value)) return { kind: "caster-punks-image-corpus", status: "rights-review-required", sensitive: false, rightsReviewRequired: true, attributionRequired: false };
  if (value.includes("caster-claim-miniapp")) return { kind: "claim-miniapp-asset", status: "rights-review-required", sensitive: false, rightsReviewRequired: true, attributionRequired: false };
  if (value.endsWith("package.json")) return { kind: "package-manifest", status: "license-unknown", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.includes("vendor") || value.endsWith(".min.js")) return { kind: "vendor-file", status: "attribution-required", sensitive: false, rightsReviewRequired: true, attributionRequired: true };
  if (value.includes("/public/") || /\.(png|jpg|jpeg|webp|svg|ico|json)$/i.test(value)) return { kind: "public-asset", status: "rights-review-required", sensitive: false, rightsReviewRequired: true, attributionRequired: false };
  if (value.startsWith("packages/sdk")) return { kind: "sdk-package", status: "license-unknown", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.includes("install") || value.includes("installer")) return { kind: "installer", status: "inventoried", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.includes("deploy")) return { kind: "deployment-script", status: "inventoried", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.endsWith(".md")) return { kind: "doc", status: "inventoried", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.endsWith(".cjs") || value.endsWith(".mjs") || value.endsWith(".ps1")) return { kind: "script", status: "inventoried", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  if (value.includes("vercel") || value.includes("netlify") || value.includes("render") || value.includes("fly")) return { kind: "config", status: "legacy-reference", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
  return { kind: "unknown", status: "inventoried", sensitive: false, rightsReviewRequired: false, attributionRequired: false };
}

function redactPath(inputPath: string): string {
  return /balances|ranking|processed|pending|tipping|reward|runtime-state/i.test(inputPath) ? "[redacted-sensitive-path]" : inputPath;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => `${JSON.stringify(key)}:${stable(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
