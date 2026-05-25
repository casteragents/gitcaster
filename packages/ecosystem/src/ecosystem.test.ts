import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalEcosystemManifest, createEcosystemEntry, manifestRootHash, validateCanonicalEcosystemManifest } from "./canonical-manifest.js";
import { classifyKnownCasterProject } from "./classify.js";
import { classifyLegacyPlatform } from "./legacy-platform-detect.js";
import { classifySensitivePath, redactSensitiveFinding } from "./sensitive-files.js";

test("canonical entry validates", () => {
  const entry = createEcosystemEntry({
    id: "gitcaster",
    name: "GitCaster",
    category: "Protocol",
    sourcePath: ".",
    sensitivity: "public",
    status: "alpha-local",
    repoStatus: "alpha-local",
    deployStatus: "blocked",
    qstorageStatus: "requires-endpoint",
    castercloudStatus: "requires-endpoint",
    miniappCompatible: null,
    farcasterCompatible: null,
    gameCompatible: null,
    tokenHooks: [],
    agents: [],
    evidence: [],
    blockers: [],
    publicDescription: "GitCaster protocol entry."
  });
  const manifest = createCanonicalEcosystemManifest({ createdAt: "2026-05-22T00:00:00.000Z", entries: [entry] });
  assert.deepEqual(validateCanonicalEcosystemManifest(manifest), []);
});

test("manifest root hash is deterministic", () => {
  const manifest = createCanonicalEcosystemManifest({ createdAt: "2026-05-22T00:00:00.000Z", entries: [] });
  assert.equal(manifest.rootHash, manifestRootHash(manifest));
});

test("Caster Claim Miniapp classification is Miniapps public preview", () => {
  const item = classifyKnownCasterProject("Caster Claim Miniapp");
  assert.equal(item.category, "Miniapps");
  assert.equal(item.sensitivity, "public");
  assert.equal(item.status, "preview");
});

test("CasterAgents classification is sensitive needs-review", () => {
  const item = classifyKnownCasterProject("CasterAgents");
  assert.equal(item.sensitivity, "sensitive");
  assert.equal(item.status, "needs-review");
});

test("Caster Punks classification is Collectibles index-only preview", () => {
  const item = classifyKnownCasterProject("Caster Punks");
  assert.equal(item.category, "Collectibles");
  assert.equal(item.status, "preview");
  assert.equal(item.qstorageStatus, "requires-endpoint");
});

test("$CASTER token classification is proof-only", () => {
  const item = classifyKnownCasterProject("$CASTER token");
  assert.equal(item.category, "Token");
  assert.equal(item.status, "proof-only");
  assert.deepEqual(item.tokenHooks, ["proof-only"]);
});

test("Vercel config classification is legacy-reference", () => {
  assert.equal(classifyLegacyPlatform("caster-claim-miniapp/vercel.json"), "legacy-reference");
});

test("sensitive runtime filenames classify without content", () => {
  assert.equal(classifySensitivePath("balances.json"), "sensitive-runtime-state");
  assert.equal(classifySensitivePath("processed_ids.txt"), "sensitive-runtime-state");
  assert.equal(classifySensitivePath("pending-posts.json"), "sensitive-runtime-state");
});

test("secret-risk files classify", () => {
  assert.equal(classifySensitivePath("openai.ts"), "secret-risk");
  assert.equal(classifySensitivePath("farcaster.ts"), "secret-risk");
});

test("redacted finding does not include file contents", () => {
  const finding = redactSensitiveFinding({ path: "balances.json", classification: "sensitive-runtime-state", reason: "runtime state" });
  assert.equal(finding.redacted, true);
  assert.equal("contents" in finding, false);
});

test("generated manifest uses GitCaster public identity", () => {
  const manifest = createCanonicalEcosystemManifest({ entries: [] });
  assert.equal(manifest.product, "GitCaster");
  assert.equal(JSON.stringify(manifest).includes(`git${"lawb"}://`), false);
});

test("no forbidden live statuses are generated", () => {
  const item = classifyKnownCasterProject("Caster Claim Miniapp");
  assert.equal(["live", "verified", "deployed", "production"].includes(item.status), false);
});

test("hosted platform is not marked production", () => {
  const item = classifyKnownCasterProject("caster-claim-miniapp/vercel.json");
  assert.equal(item.status, "legacy-reference");
  assert.notEqual(item.deployStatus, "castercloud-ready");
});
