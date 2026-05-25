import assert from "node:assert/strict";
import test from "node:test";
import { classifyInventoryPath, createThirdPartyInventory, createThirdPartyItem, inventoryRootHash } from "./third-party-inventory.js";
import { createDefaultLicensePolicy, createLicenseReview, evaluateLicensePolicy } from "./license-review.js";
import { classifyDataRightsPath, createDataRightsReview } from "./data-rights.js";

test("inventory root hash is deterministic", () => {
  const item = createThirdPartyItem({ path: "packages/audit/package.json", kind: "package-manifest", status: "license-unknown", name: "package.json", packageName: null, version: null, license: null, licenseSource: null, attributionRequired: false, rightsReviewRequired: false, sensitive: false, publicBundleAllowed: false, evidence: [], blockers: [] });
  const inventory = createThirdPartyInventory([item], "2026-05-22T00:00:00.000Z");
  assert.equal(inventory.rootHash, inventoryRootHash(inventory));
});

test("CasterAgents runtime state is sensitive/private", () => {
  assert.equal(classifyInventoryPath("casteragents-projects/agent-state/pending-posts.json").status, "sensitive-private");
});

test("Caster Punks images are rights-review-required", () => {
  assert.equal(classifyInventoryPath("apps/web/public/caster-punks-sample/1.png").status, "rights-review-required");
});

test("package manifests have unknown license until metadata exists", () => {
  assert.equal(classifyInventoryPath("packages/audit/package.json").status, "license-unknown");
});

test("permissive license is attribution tracked, not legal clearance", () => {
  const item = createThirdPartyItem({ path: "x", kind: "package-manifest", status: "license-known", name: "x", packageName: "x", version: "1.0.0", license: "MIT", licenseSource: "package.json", attributionRequired: false, rightsReviewRequired: false, sensitive: false, publicBundleAllowed: false, evidence: [], blockers: [] });
  const review = evaluateLicensePolicy(item, createDefaultLicensePolicy());
  assert.equal(review.status, "attribution-required");
});

test("unknown license is review-required", () => {
  const item = createThirdPartyItem({ path: "x", kind: "package-manifest", status: "license-unknown", name: "x", packageName: "x", version: null, license: null, licenseSource: null, attributionRequired: false, rightsReviewRequired: false, sensitive: false, publicBundleAllowed: false, evidence: [], blockers: [] });
  assert.equal(evaluateLicensePolicy(item).status, "review-required");
});

test("license review does not claim legal clearance", () => {
  const review = createLicenseReview({ items: [] });
  assert.equal(review.legalClearanceClaimed, false);
});

test("data rights flags pending social content", () => {
  assert.equal(classifyDataRightsPath("casteragents-projects/agent-state/pending-posts.json"), "pending-social-content");
});

test("data rights flags balances and rankings", () => {
  assert.equal(classifyDataRightsPath("casteragents-projects/balances.json"), "rankings-balances");
});

test("data rights flags integration files", () => {
  assert.equal(classifyDataRightsPath("src/lib/openai.ts"), "bot-script");
});

test("data rights review blocks private runtime state", () => {
  const review = createDataRightsReview({ paths: ["casteragents-projects/runtime-state.json"] });
  assert.equal(review.status, "blocked");
  assert.equal(review.dataRightsClearedClaimed, false);
});

test("generated audit JSON does not contain reference-only public identity", () => {
  const json = JSON.stringify(createThirdPartyInventory([]));
  assert.equal(new RegExp("git" + "lawb", "i").test(json), false);
});

test("generated audit JSON does not set canShipProduction true", () => {
  assert.equal(createThirdPartyInventory([]).canShipProduction, false);
});
