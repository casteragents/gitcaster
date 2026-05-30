import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalEcosystemManifest, createEcosystemEntry } from "./canonical-manifest.js";
import { appDirectoryRootHash, createAppDirectory, createAppDirectoryEntry, validateAppDirectoryEntry } from "./app-directory.js";
import { createAppShellCatalog, validateAppShellCatalog } from "./app-shell-catalog.js";
import { deriveRcEntriesFromCanonicalManifest } from "./ecosystem-rc.js";
import { classifySubmissionClaim, createSubmissionReview, redactSubmission, type GitCasterAppSubmission } from "./submission-policy.js";

function fixtureEntry(name: string, overrides: Partial<Parameters<typeof createEcosystemEntry>[0]> = {}) {
  return createEcosystemEntry({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    category: "Miniapps",
    sourcePath: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sensitivity: "public",
    status: "preview",
    repoStatus: "not-imported",
    deployStatus: "requires-endpoint",
    qstorageStatus: "requires-endpoint",
    castercloudStatus: "requires-endpoint",
    miniappCompatible: true,
    farcasterCompatible: true,
    gameCompatible: null,
    tokenHooks: [],
    agents: [],
    evidence: [],
    blockers: ["Evidence required before stronger status."],
    publicDescription: `${name} preview entry.`,
    ...overrides
  });
}

test("app directory entry validates", () => {
  const entry = createAppDirectoryEntry({
    id: "caster-claim-miniapp",
    name: "Caster Claim Miniapp",
    category: "Miniapps",
    status: "template-candidate",
    sourcePath: "caster-claim-miniapp",
    builder: "CasterChain",
    builderUrl: null,
    repoUrl: null,
    demoUrl: null,
    description: "Template candidate.",
    uses: ["GitCaster", "CasterCloud", "QStorage"],
    proof: { live: false, deployed: false, verified: false, qstorageVerified: false, castercloudVerified: false, securityReviewed: false, evidence: [] },
    safety: { sensitivity: "public", runtimeStatePublic: false, secretsExposed: false, imagesBundled: false, redacted: true },
    badges: [],
    blockers: []
  });
  assert.deepEqual(validateAppDirectoryEntry(entry), []);
});

test("app directory root hash is deterministic", () => {
  const directory = createAppDirectory({ createdAt: "2026-05-22T00:00:00.000Z", entries: [] });
  assert.equal(directory.rootHash, appDirectoryRootHash(directory));
});

test("canonical manifest can derive RC entries", () => {
  const manifest = createCanonicalEcosystemManifest({ createdAt: "2026-05-22T00:00:00.000Z", entries: [fixtureEntry("Caster Claim Miniapp")] });
  assert.equal(deriveRcEntriesFromCanonicalManifest(manifest).length, 1);
});

test("Caster Claim Miniapp becomes template-candidate, not live", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("Caster Claim Miniapp")] }));
  assert.equal(entry.status, "template-candidate");
  assert.equal(entry.proof.live, false);
});

test("Caster Punks remains index-only", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("Caster Punks", { category: "Collectibles" })] }));
  assert.equal(entry.status, "index-only");
  assert.equal(entry.safety.imagesBundled, false);
});

test("CasterAgents remains sensitive/needs-review/blocked", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("CasterAgents", { category: "Agents", sensitivity: "sensitive", status: "needs-review" })] }));
  assert.equal(entry.status, "needs-review");
  assert.equal(entry.safety.sensitivity, "sensitive");
  assert.ok(entry.blockers.length > 0);
});

test("CasterAgents runtime state public is false", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("CasterAgents", { category: "Agents", sensitivity: "sensitive" })] }));
  assert.equal(entry.safety.runtimeStatePublic, false);
});

test("QStorage verified false without evidence", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("QStorage App", { category: "Storage" })] }));
  assert.equal(entry.proof.qstorageVerified, false);
});

test("CasterCloud verified false without evidence", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("CasterCloud App", { category: "CasterCloud deployments" })] }));
  assert.equal(entry.proof.castercloudVerified, false);
});

test("token utility remains proof-only/requires-contract", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("$CASTER token", { category: "Token", status: "proof-only" })] }));
  assert.equal(entry.status, "proof-only");
  assert.ok(entry.blockers.some((blocker) => blocker.includes("Contract")));
});

test("domain mapped requires registry", () => {
  const [entry] = deriveRcEntriesFromCanonicalManifest(createCanonicalEcosystemManifest({ entries: [fixtureEntry("Domain mapping", { category: "Domains", status: "requires-registry" })] }));
  assert.equal(entry.status, "requires-registry");
});

test("submission with live claim requires evidence", () => {
  assert.equal(classifySubmissionClaim("app is live").status, "requires-deployment-proof");
});

test("submission with production-ready claim is rejected/blocked", () => {
  assert.equal(classifySubmissionClaim("production-ready").status, "blocked");
});

test("submission with reference identity is rejected", () => {
  assert.equal(classifySubmissionClaim("use git" + "lawb as identity").status, "rejected");
});

test("submission with legacy protocol URL is rejected", () => {
  assert.equal(classifySubmissionClaim("git" + "lawb://example").status, "rejected");
});

test("submission with legacy DID is rejected", () => {
  assert.equal(classifySubmissionClaim("did:" + "gitlawb:z123").status, "rejected");
});

test("submission with legacy token env is rejected", () => {
  assert.equal(classifySubmissionClaim("$" + "GITLAWB").status, "rejected");
});

test("submission with hosted-platform production path is rejected", () => {
  assert.equal(classifySubmissionClaim("production path is vercel").status, "rejected");
});

test("submission redaction removes contact/private values where needed", () => {
  const submission: GitCasterAppSubmission = {
    type: "gitcaster.ecosystem.submission.v1",
    appName: "Example",
    category: "Miniapps",
    contact: "founder@example.test",
    claims: []
  };
  assert.equal(redactSubmission(submission).contact, "[redacted-contact]");
});

test("generated directory JSON does not set canShipProduction true", () => {
  const directory = createAppDirectory({ entries: [] });
  assert.equal(directory.canShipProduction, false);
});

test("app shell catalog derives local-only shell entries without native deployment claims", () => {
  const entries = deriveRcEntriesFromCanonicalManifest(
    createCanonicalEcosystemManifest({ entries: [fixtureEntry("Caster Claim Miniapp")] })
  );
  const catalog = createAppShellCatalog({ directory: createAppDirectory({ entries }) });
  assert.equal(catalog.status, "public-alpha");
  assert.equal(catalog.canShipProduction, false);
  assert.equal(catalog.entries[0]?.kind, "miniapp-shell");
  assert.equal(catalog.entries[0]?.localPreviewPath, "/ecosystem/caster-claim-miniapp");
  assert.equal(catalog.entries[0]?.proof.nativeDeployment, false);
  assert.equal(catalog.entries[0]?.dependencyRisk.nativeStorage, "blocked_external");
  assert.deepEqual(validateAppShellCatalog(catalog), []);
});

test("submission review never accepts automatically", () => {
  const review = createSubmissionReview({ type: "gitcaster.ecosystem.submission.v1", appName: "Example", category: "Miniapps", claims: ["verified"] });
  assert.equal(review.accepted, false);
  assert.equal(review.featured, false);
});
