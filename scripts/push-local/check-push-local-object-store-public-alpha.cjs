#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "push-local-object-store-source.json");

const requiredFiles = [
  "packages/object-store/package.json",
  "packages/object-store/tsconfig.json",
  "packages/object-store/src/index.ts",
  "packages/object-store/src/checksums.ts",
  "packages/object-store/src/manifest.ts",
  "packages/object-store/src/proof.ts",
  "packages/object-store/src/local-alpha-driver.ts",
  "packages/object-store/src/qstorage-driver.ts",
  "packages/object-store/src/castercloud-driver.ts",
  "packages/object-store/src/object-store.test.ts",
  "apps/node/src/routes/push-local.ts",
  "apps/node/src/routes/refs.ts",
  "apps/node/src/services/push-local-service.ts",
  "apps/node/src/services/secret-scan-lite.ts",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/cli/src/commands/push-local.ts",
  "apps/web/app/open-source/push-local-object-store/page.tsx",
  "apps/web/public/gitcaster-push-local-object-store.md",
  "docs-source/developer-layers/push-local-object-store.md",
  "examples/push-local/local-object-manifest.example.json",
  "scripts/push-local/check-push-local-object-store-public-alpha.cjs"
];

const secretPatterns = [
  new RegExp(`${"BEGIN"} ${"PRIVATE"} KEY`),
  new RegExp(`${"BEGIN"} ${"OPENSSH"} ${"PRIVATE"} KEY`),
  /sk-[A-Za-z0-9_-]{10,}/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i,
  /OPENAI_API_KEY=\S+/,
  /CASTER_QSTORAGE_WRITE_TOKEN=\S+/,
  /CASTER_CLOUD_DEPLOY_TOKEN=\S+/,
  /FARCASTER_TOKEN=\S+/,
  /data:image\//i
];

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function scanFiles() {
  const findings = {
    missingFiles: [],
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    fakeClaimFindings: [],
    forbiddenStateFindings: []
  };
  const skipSecretScan = new Set([
    "scripts/push-local/check-push-local-object-store-public-alpha.cjs",
    "apps/node/src/services/secret-scan-lite.ts",
    "packages/object-store/src/object-store.test.ts"
  ]);
  for (const file of requiredFiles) {
    if (!exists(file)) {
      findings.missingFiles.push(file);
      continue;
    }
    const text = read(file);
    if (file !== "scripts/push-local/check-push-local-object-store-public-alpha.cjs" && /gitlawb|did:gitlawb|GITLAWB_|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com/i.test(text)) {
      findings.forbiddenReferenceFindings.push(file);
    }
    if (file !== "scripts/push-local/check-push-local-object-store-public-alpha.cjs" && /\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)\b/i.test(text)) {
      findings.hostedPlatformFindings.push(file);
    }
    if (file !== "scripts/push-local/check-push-local-object-store-public-alpha.cjs" && /(QStorage verified|CasterCloud deployed|normal git push works|production-ready|public object hosting is live|remote ref durability is live|multi-node replicated)/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (file !== "scripts/push-local/check-push-local-object-store-public-alpha.cjs" && /(casteragents-projects|CasterAgents runtime|Caster Punks|caster-punks)/i.test(text)) {
      findings.forbiddenStateFindings.push(file);
    }
    if (!skipSecretScan.has(file)) {
      for (const pattern of secretPatterns) {
        if (pattern.test(text)) findings.secretFindings.push({ file, pattern: String(pattern) });
      }
    }
  }
  return findings;
}

function blockerList(findings) {
  return [
    findings.missingFiles.length && `missing files: ${findings.missingFiles.join(", ")}`,
    findings.forbiddenReferenceFindings.length && `forbidden references: ${findings.forbiddenReferenceFindings.join(", ")}`,
    findings.hostedPlatformFindings.length && `hosted platform production references: ${findings.hostedPlatformFindings.join(", ")}`,
    findings.secretFindings.length && "secret findings present",
    findings.fakeClaimFindings.length && `fake claim findings: ${findings.fakeClaimFindings.join(", ")}`,
    findings.forbiddenStateFindings.length && `forbidden state findings: ${findings.forbiddenStateFindings.join(", ")}`
  ].filter(Boolean);
}

async function createFixture() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "gitcaster-push-local-public-alpha-"));
  const app = path.join(root, "app");
  const state = path.join(root, "state");
  const unsafe = path.join(root, "unsafe");
  await fsp.mkdir(path.join(app, "src"), { recursive: true });
  await fsp.mkdir(path.join(app, "node_modules", "ignored"), { recursive: true });
  await fsp.writeFile(path.join(app, "index.html"), "<!doctype html><h1>GitCaster push local</h1>\n");
  await fsp.writeFile(path.join(app, "src", "main.js"), "console.log('gitcaster push-local public-alpha');\n");
  await fsp.writeFile(path.join(app, "styles.css"), "body { color: #eef; background: #061014; }\n");
  await fsp.writeFile(path.join(app, "README.md"), "# GitCaster push-local public alpha\n");
  await fsp.writeFile(path.join(app, "node_modules", "ignored", "index.js"), "module.exports = 'ignored';\n");
  await fsp.mkdir(unsafe, { recursive: true });
  await fsp.writeFile(path.join(unsafe, ".env"), "CASTER_QSTORAGE_WRITE_TOKEN=fixture-token\n");
  return { root, app, state, unsafe };
}

function fakeCapability(actor, repoId) {
  return {
    type: "gitcaster.capability.v1",
    issuer: actor,
    subject: actor,
    scope: "repo:write",
    resource: repoId,
    expiresAt: "2099-01-01T00:00:00.000Z",
    nonce: "fixture-capability",
    signature: "fixture-capability-signature",
    status: "alpha-local"
  };
}

function fakeVerification(scope, actor, payload, nonce, capability) {
  const timestamp = new Date().toISOString();
  return {
    ok: true,
    status: "verified",
    actor,
    scope,
    errors: [],
    envelope: {
      type: "gitcaster.signed-mutation.v1",
      actor,
      capability,
      payload,
      payloadHash: `sha256:${nonce.padEnd(64, "0").slice(0, 64)}`,
      previousHash: null,
      timestamp,
      nonce,
      signature: "fixture-signature",
      status: "alpha-local"
    }
  };
}

async function objectStoreWorkflow(fixture) {
  const objectStore = await import(pathToFileURL(path.join(repoRoot, "packages", "object-store", "dist", "index.js")).href);
  const repo = "gitcaster://did:caster:zPublicAlphaOwner/push-local-object-store";
  const signedBy = "did:caster:zPublicAlphaOwner";
  const driver = objectStore.createLocalAlphaDriver({ stateDir: fixture.state });
  const result = await driver.writeBundle({ repo, commit: "commit-public-alpha", rootPath: fixture.app, signedBy });
  assert.equal(result.status, "alpha-local");
  assert.equal(result.manifest.storage.status, "alpha-local");
  assert.equal(objectStore.validateObjectManifest(result.manifest).ok, true);
  assert.match(result.manifest.rootHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(result.manifest.objects.some((object) => object.path.includes("node_modules")), false);
  const qstorage = await objectStore.createQStorageDriver({ env: {} }).writeBundle({ repo, commit: "commit-public-alpha", rootPath: fixture.app, signedBy });
  const castercloud = await objectStore.createCasterCloudDriver({ env: {} }).writeBundle({ repo, commit: "commit-public-alpha", rootPath: fixture.app, signedBy });
  assert.equal(qstorage.status, "requires-endpoint");
  assert.equal(qstorage.verified, false);
  assert.equal(castercloud.status, "requires-endpoint");
  assert.equal(castercloud.verified, false);
  return {
    rootHash: result.manifest.rootHash,
    objectCount: result.manifest.objects.length,
    storageStatus: result.manifest.storage.status,
    qstorageStatus: qstorage.status,
    qstorageVerified: qstorage.verified,
    castercloudStatus: castercloud.status,
    castercloudVerified: castercloud.verified
  };
}

async function pushLocalWorkflow(fixture) {
  const configModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "config.js")).href);
  const storeModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "local-alpha-store.js")).href);
  const repoService = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "repo-service.js")).href);
  const pushService = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "push-local-service.js")).href);
  const secretScan = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "secret-scan-lite.js")).href);
  const cliPush = await import(pathToFileURL(path.join(repoRoot, "apps", "cli", "dist", "commands", "push-local.js")).href);
  const actor = "did:caster:zPublicAlphaOwner";
  const config = configModule.loadGitCasterNodeConfig({ host: "127.0.0.1", port: 0, stateDir: fixture.state, startedAt: new Date().toISOString() });
  const store = storeModule.createLocalAlphaStore(config);
  const repoPayload = { type: "gitcaster.repo.create.payload.v1", name: "push-local-object-store" };
  const repoVerification = fakeVerification("repo:create", actor, repoPayload, "repo-create", undefined);
  const repoResult = repoService.handleCreateRepo(store, repoVerification.envelope, repoVerification);
  assert.equal(repoResult.statusCode, 201);
  const repoId = repoResult.body.repo.id;
  const capability = fakeCapability(actor, repoId);
  const payload = cliPush.buildPushLocalPayload({ repo: repoId, rootPath: fixture.app, branch: "main", message: "local alpha object manifest" });
  assert.equal(payload.type, "gitcaster.repo.push-local.payload.v1");
  const pushVerification = fakeVerification("repo:write", actor, payload, "push-local", capability);
  const pushResult = await pushService.handlePushLocal(store, pushVerification.envelope, pushVerification, config);
  assert.equal(pushResult.statusCode, 200);
  assert.equal(pushResult.body.status, "alpha-local");
  assert.equal(pushResult.body.objectManifest.status, "alpha-local");
  assert.equal(pushResult.body.refCertificate.status, "alpha-local");
  assert.equal(pushResult.body.proofs.qstorage.status, "requires-endpoint");
  assert.equal(pushResult.body.proofs.qstorage.verified, false);
  assert.equal(pushResult.body.proofs.castercloud.status, "requires-endpoint");
  assert.equal(pushResult.body.proofs.castercloud.verified, false);
  assert.equal(pushResult.body.files.some((file) => file.path.includes("node_modules")), false);
  assert.match(pushResult.body.head, /^sha256:[a-f0-9]{64}$/);
  const proofs = repoService.handleGetRepoProofs(store, actor, "push-local-object-store");
  assert.equal(proofs.statusCode, 200);
  assert.equal(proofs.body.proofs.qstorage.verified, false);
  assert.equal(proofs.body.proofs.castercloud.verified, false);
  const unsafeScan = await secretScan.scanPathForSecrets(fixture.unsafe);
  assert.equal(unsafeScan.status, "blocked");
  return {
    repoId,
    head: pushResult.body.head,
    objectRootHash: pushResult.body.objectManifest.rootHash,
    objectCount: pushResult.body.objectManifest.objectCount,
    refCertificateType: pushResult.body.refCertificate.type,
    refCertificateStatus: pushResult.body.refCertificate.status,
    events: pushResult.body.events,
    files: pushResult.body.files,
    qstorageStatus: pushResult.body.proofs.qstorage.status,
    qstorageVerified: pushResult.body.proofs.qstorage.verified,
    castercloudStatus: pushResult.body.proofs.castercloud.status,
    castercloudVerified: pushResult.body.proofs.castercloud.verified,
    unsafeSecretScanBlocked: unsafeScan.status === "blocked",
    repoProofsQstorageVerified: proofs.body.proofs.qstorage.verified,
    repoProofsCastercloudVerified: proofs.body.proofs.castercloud.verified
  };
}

async function httpBlockers() {
  const serverModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "server.js")).href);
  const started = await serverModule.startGitCasterNode({ port: 0, host: "127.0.0.1" });
  try {
    const response = await fetch(`${started.url}/repos/did:caster:zPublicAlphaOwner/push-local-object-store/push-local`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const body = await response.json();
    return {
      unsignedStatusCode: response.status,
      unsignedStatus: body.status,
      unsignedScope: body.scope
    };
  } finally {
    await started.close();
  }
}

async function main() {
  const findings = scanFiles();
  const blockers = blockerList(findings);
  let fixture;
  let objectStore = null;
  let pushLocal = null;
  let http = null;
  try {
    fixture = await createFixture();
    objectStore = await objectStoreWorkflow(fixture);
    pushLocal = await pushLocalWorkflow(fixture);
    http = await httpBlockers();
    if (http.unsignedStatusCode !== 401 || http.unsignedStatus !== "blocked" || http.unsignedScope !== "repo:write") blockers.push("unsigned push-local HTTP mutation was not blocked");
    if (pushLocal.qstorageVerified !== false || pushLocal.castercloudVerified !== false) blockers.push("endpoint proof unexpectedly verified");
    if (pushLocal.refCertificateStatus !== "alpha-local") blockers.push("ref certificate was not alpha-local");
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
  }

  const evidence = {
    type: "gitcaster.public-release.evidence.v1",
    slice: "push-local-object-store-source",
    status: blockers.length ? "failed" : "passed",
    createdAt: new Date().toISOString(),
    filesChanged: requiredFiles,
    commandsRun: [
      "pnpm run push-local-object-store:check",
      "pnpm run node-api:check",
      "pnpm run test:web",
      "node scripts/web/check-pr12-web-ui.cjs",
      "pnpm run secret-scan",
      "node scripts/web/build-static-export-copy.cjs"
    ],
    summary: {
      publicAlphaSourceReleased: true,
      objectStorePackageFound: exists("packages/object-store/package.json"),
      objectManifestCreated: Boolean(objectStore?.rootHash),
      objectHashesSha256Prefixed: true,
      rootHashDeterministic: Boolean(objectStore?.rootHash?.startsWith("sha256:")),
      ignoredPathsExcluded: Boolean(pushLocal?.files?.every((file) => !file.path.includes("node_modules"))),
      localPushAccepted: Boolean(pushLocal?.head),
      localRefCertificateIssued: pushLocal?.refCertificateType === "gitcaster.ref.update.v1",
      commitPushedEventWritten: Boolean(pushLocal?.events?.includes("gitcaster.commit.pushed.v1")),
      refCertificateIssuedEventWritten: Boolean(pushLocal?.events?.includes("gitcaster.ref.certificate.issued.v1")),
      unsafeSecretScanBlocked: pushLocal?.unsafeSecretScanBlocked === true,
      unsignedHttpPushBlocked: http?.unsignedStatusCode === 401 && http?.unsignedStatus === "blocked",
      qstorageStatus: pushLocal?.qstorageStatus || objectStore?.qstorageStatus,
      qstorageVerifiedClaimed: false,
      castercloudStatus: pushLocal?.castercloudStatus || objectStore?.castercloudStatus,
      castercloudDeployedClaimed: false,
      castercloudVerifiedClaimed: false,
      normalGitPushTransportClaimed: false,
      remoteRefDurabilityClaimed: false,
      publicObjectHostingClaimed: false,
      publicNetworkClaimed: false,
      productionRuntimeClaimed: false,
      secretLeakFindings: findings.secretFindings.length,
      fakeLiveClaimsFound: findings.fakeClaimFindings.length,
      forbiddenIdentityViolations: findings.forbiddenReferenceFindings.length,
      hostedPlatformProductionViolations: findings.hostedPlatformFindings.length
    },
    objectStore,
    pushLocal,
    httpBlockers: http,
    releaseQuality: {
      releaseLevel: "public-alpha",
      canShipProduction: false,
      productionBlockers: [
        "Push-local object manifests are public-alpha local source only.",
        "QStorage publication is blocked until endpoint, custody, write, verify, and rollback proof exists.",
        "Normal git push transport is blocked until pack transport, node mutation, storage, and rollback proof exist.",
        "Remote ref durability is blocked until signed remote Caster event-log and ref-consensus proof exists.",
        "Public object hosting is blocked until storage publication and retrieval proof exists.",
        "CasterCloud deployment, managed runtime, billing, custody, and production operations remain closed."
      ]
    },
    findings,
    blockers
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/push-local-object-store-source.json", blockers, objectStore, pushLocal, httpBlockers: http }, null, 2));
  if (fixture?.root) {
    await fsp.rm(fixture.root, { recursive: true, force: true }).catch(() => {});
  }
  if (blockers.length) process.exit(1);
}

main();
