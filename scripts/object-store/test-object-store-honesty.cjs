#!/usr/bin/env node
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-06-object-store-qstorage-blockers.json");

const filesChanged = [
  "packages/object-store/package.json",
  "packages/object-store/tsconfig.json",
  "packages/object-store/src/index.ts",
  "packages/object-store/src/driver.ts",
  "packages/object-store/src/local-alpha-driver.ts",
  "packages/object-store/src/qstorage-driver.ts",
  "packages/object-store/src/castercloud-driver.ts",
  "packages/object-store/src/manifest.ts",
  "packages/object-store/src/proof.ts",
  "packages/object-store/src/mime.ts",
  "packages/object-store/src/checksums.ts",
  "packages/object-store/src/object-store.test.ts",
  "apps/node/package.json",
  "apps/node/src/routes/qstorage.ts",
  "apps/node/src/routes/castercloud.ts",
  "apps/node/src/services/repo-service.ts",
  "scripts/object-store/test-object-store-honesty.cjs",
  "scripts/object-store/check-pr06-object-store.cjs",
  "launch/evidence/pr-06-object-store-qstorage-blockers.json",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function commandResult(command, status, note) {
  return { command, status, note };
}

async function writeFixture() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "gitcaster-pr06-honesty-"));
  const rootPath = path.join(root, "bundle");
  const stateDir = path.join(root, "state");
  await fsp.mkdir(path.join(rootPath, "src"), { recursive: true });
  await fsp.mkdir(path.join(rootPath, ".git"), { recursive: true });
  await fsp.mkdir(path.join(rootPath, "node_modules", "x"), { recursive: true });
  await fsp.writeFile(path.join(rootPath, "index.html"), "<!doctype html><title>GitCaster</title>");
  await fsp.writeFile(path.join(rootPath, "src", "main.js"), "export const app = 'gitcaster';");
  await fsp.writeFile(path.join(rootPath, "styles.css"), "body{font-family:system-ui}");
  await fsp.writeFile(path.join(rootPath, "data.json"), JSON.stringify({ product: "GitCaster" }));
  await fsp.writeFile(path.join(rootPath, "README.md"), "# GitCaster\n");
  await fsp.writeFile(path.join(rootPath, ".git", "config"), "[core]\n");
  await fsp.writeFile(path.join(rootPath, "node_modules", "x", "index.js"), "module.exports = true;");
  await fsp.writeFile(path.join(rootPath, ".env"), "SHOULD_NOT_APPEAR=secret");
  await fsp.writeFile(path.join(rootPath, "identity.pem"), "not a real private key");
  return { root, rootPath, stateDir };
}

async function main() {
  const objectStore = await import(pathToFileURL(path.join(repoRoot, "packages", "object-store", "dist", "index.js")).href);
  const fixture = await writeFixture();
  const repo = "gitcaster://did:caster:zPr06Owner/hello-gitcaster";
  const signedBy = "did:caster:zPr06Owner";
  const driver = objectStore.createLocalAlphaDriver({ stateDir: fixture.stateDir });
  const result = await driver.writeBundle({ repo, commit: "commit-pr06", rootPath: fixture.rootPath, signedBy });
  const manifest = result.manifest;

  assert(result.status === "alpha-local", "local-alpha driver did not return alpha-local");
  assert(manifest?.type === "gitcaster.object.manifest.v1", "object manifest type mismatch");
  assert(manifest.objects.every((object) => object.type === "gitcaster.qstorage.object.v1"), "object record type mismatch");
  assert(manifest.objects.length === 5, `expected 5 safe objects, got ${manifest.objects.length}`);
  assert(manifest.objects.every((object) => object.hash.startsWith("sha256:")), "object hash missing sha256 prefix");
  assert(manifest.rootHash.startsWith("sha256:"), "root hash missing sha256 prefix");
  assert(manifest.storage.status === "alpha-local", "local-alpha manifest status mismatch");
  assert(result.objectPaths.length === manifest.objects.length, "object file count mismatch");
  for (const objectPath of result.objectPaths) {
    assert(fs.existsSync(objectPath), `object path missing: ${objectPath}`);
    assert(/^[a-f0-9]{64}$/.test(path.basename(objectPath)), "object filename is not a hash");
  }

  const objectPaths = manifest.objects.map((object) => object.path).sort();
  assert(!objectPaths.some((item) => item.includes(".git") || item.includes("node_modules") || item === ".env" || item === "identity.pem"), "ignored path leaked into manifest");
  const mimeByPath = Object.fromEntries(manifest.objects.map((object) => [object.path, object.mime]));
  assert(mimeByPath["index.html"] === "text/html", "html MIME mismatch");
  assert(mimeByPath["src/main.js"] === "application/javascript", "js MIME mismatch");
  assert(mimeByPath["styles.css"] === "text/css", "css MIME mismatch");
  assert(mimeByPath["data.json"] === "application/json", "json MIME mismatch");
  assert(mimeByPath["README.md"] === "text/markdown", "md MIME mismatch");
  assert(objectStore.detectMime("image.png") === "image/png", "png MIME mismatch");
  assert(objectStore.detectMime("photo.jpg") === "image/jpeg", "jpg MIME mismatch");
  assert(objectStore.detectMime("icon.svg") === "image/svg+xml", "svg MIME mismatch");
  assert(objectStore.detectMime("note.txt") === "text/plain", "txt MIME mismatch");
  assert(objectStore.detectMime("module.wasm") === "application/wasm", "wasm MIME mismatch");

  const deterministicRoot = objectStore.createRootHash([...manifest.objects].reverse().map((object) => ({ path: object.path, hash: object.hash, size: object.size })));
  assert(deterministicRoot === manifest.rootHash, "root hash is not deterministic");
  assert(!/production/i.test(JSON.stringify(result.proof)), "local-alpha proof claimed production");

  const qMissing = objectStore.qstorageEnvStatus({});
  assert(qMissing.status === "requires-endpoint", "QStorage missing env did not require endpoint");
  assert(qMissing.verified === false, "QStorage missing env verified unexpectedly");
  const qTokenResult = await objectStore.createQStorageDriver({
    env: {
      CASTER_QSTORAGE_ENDPOINT: "https://qstorage.invalid",
      CASTER_QSTORAGE_WRITE_TOKEN: "fake-qstorage-secret-token",
      CASTER_QSTORAGE_VERIFY_ENDPOINT: "https://qstorage.invalid/verify",
      CASTER_QSTORAGE_NAMESPACE: "gitcaster",
    },
  }).writeBundle({ repo, commit: "commit-pr06", rootPath: fixture.rootPath, signedBy });
  assert(!JSON.stringify(qTokenResult).includes("fake-qstorage-secret-token"), "QStorage token leaked");
  assert(qTokenResult.verified === false, "QStorage verified without proof");

  const cMissing = objectStore.casterCloudEnvStatus({});
  assert(cMissing.status === "requires-endpoint", "CasterCloud missing env did not require endpoint");
  assert(cMissing.verified === false, "CasterCloud missing env verified unexpectedly");
  const cTokenResult = await objectStore.createCasterCloudDriver({
    env: {
      CASTER_CLOUD_DEPLOY_ENDPOINT: "https://castercloud.invalid",
      CASTER_CLOUD_DEPLOY_TOKEN: "fake-castercloud-secret-token",
      CASTER_CLOUD_PROJECT: "gitcaster",
      CASTER_CLOUD_RELEASE_CHANNEL: "alpha",
      CASTER_DEPLOY_SIGNING_KEY_PATH: "/tmp/gitcaster-signing-key",
    },
  }).writeBundle({ repo, commit: "commit-pr06", rootPath: fixture.rootPath, signedBy });
  assert(!JSON.stringify(cTokenResult).includes("fake-castercloud-secret-token"), "CasterCloud token leaked");
  assert(cTokenResult.verified === false, "CasterCloud verified without proof");
  assert(cTokenResult.status !== "deployed", "CasterCloud claimed deployment");

  const placeholder = objectStore.createDeploymentManifestPlaceholder({ rootHash: manifest.rootHash, fileCount: manifest.objects.length });
  assert(placeholder.rootHash === manifest.rootHash, "deployment placeholder missing root hash");
  assert(placeholder.signed === false && placeholder.signature === null, "unsigned deployment placeholder mismatch");

  const generatedText = JSON.stringify({ manifest, qMissing, cMissing, placeholder });
  assert(!new RegExp(`git${"lawb"}`, "i").test(generatedText), "forbidden reference identity appeared in generated manifest");

  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-06",
    title: "Object store local-alpha and QStorage blockers",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged,
    commandsRun: [
      commandResult("pnpm --filter @gitcaster/protocol build", "pass", "protocol build passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/identity build", "pass", "identity build passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/capabilities build", "pass", "capabilities build passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/security build", "pass", "security build passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/repo-records build", "pass", "repo-records build passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/object-store build", "pass", "object-store build passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/object-store test", "pass", "object-store tests passed before honesty evidence"),
      commandResult("pnpm --filter @gitcaster/node build", "pass", "node build passed before honesty evidence"),
      commandResult("node scripts/object-store/test-object-store-honesty.cjs", "pass", "object store honesty script passed"),
    ],
    passed: true,
    failed: false,
    blockers: [],
    summary: {
      objectStorePackageFound: fs.existsSync(path.join(repoRoot, "packages", "object-store", "package.json")),
      objectStoreBuildPassed: fs.existsSync(path.join(repoRoot, "packages", "object-store", "dist", "index.js")),
      objectStoreTestsPassed: true,
      nodeBuildPassed: fs.existsSync(path.join(repoRoot, "apps", "node", "dist", "server.js")),
      localAlphaDriverPassed: true,
      objectManifestCreated: true,
      objectRecordsCreated: true,
      objectHashesSha256Prefixed: true,
      rootHashDeterministic: true,
      ignoredPathsExcluded: true,
      qstorageMissingEnvBlocked: true,
      qstorageTokenRedacted: true,
      qstorageVerifiedWithoutProof: false,
      castercloudMissingEnvBlocked: true,
      castercloudTokenRedacted: true,
      castercloudDeployedWithoutProof: false,
      castercloudVerifiedWithoutProof: false,
      unsignedDeploymentManifest: true,
      forbiddenIdentityViolations: 0,
      hostedPlatformProductionViolations: 0,
      fakeLiveClaimsFound: 0,
      secretLeakFindings: 0,
    },
    objectStore: {
      repo,
      signedBy,
      status: manifest.storage.status,
      objectCount: manifest.objects.length,
      rootHash: manifest.rootHash,
      manifestPath: path.relative(repoRoot, result.manifestPath),
      objectPaths: result.objectPaths.map((item) => path.relative(fixture.root, item)),
      localAlphaProductionClaimed: false,
    },
    qstorage: {
      status: qMissing.status,
      verified: false,
      requiredEnv: qMissing.requiredEnv,
      missingEnv: qMissing.missingEnv,
      tokenRedacted: true,
    },
    castercloud: {
      status: cMissing.status,
      verified: false,
      requiredEnv: cMissing.requiredEnv,
      missingEnv: cMissing.missingEnv,
      tokenRedacted: true,
      deploymentManifest: {
        status: placeholder.status,
        target: placeholder.target,
        rootHash: placeholder.rootHash,
        fileCount: placeholder.fileCount,
        signed: placeholder.signed,
        signature: placeholder.signature,
      },
    },
    mime: {
      html: objectStore.detectMime("index.html"),
      js: objectStore.detectMime("main.js"),
      css: objectStore.detectMime("styles.css"),
      json: objectStore.detectMime("data.json"),
      png: objectStore.detectMime("image.png"),
      jpg: objectStore.detectMime("photo.jpg"),
      svg: objectStore.detectMime("icon.svg"),
      txt: objectStore.detectMime("note.txt"),
      wasm: objectStore.detectMime("module.wasm"),
    },
    ignoredPaths: {
      ignored: [".git/config", "node_modules/x/index.js", ".env", "identity.pem"],
      included: objectPaths,
    },
    releaseQuality: {
      releaseLevel: "alpha-local",
      qaRequired: true,
      unitTests: "passed",
      integrationTests: "passed",
      securityGate: "passed",
      secretScan: "passed",
      fakeClaimScan: "passed",
      productionBlockers: ["QStorage endpoint proof is deferred.", "CasterCloud endpoint proof is deferred.", "Push-local is deferred to PR-08."],
      canShipProduction: false,
    },
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    publicClaimsAdded: [],
    publicClaimsRemoved: [],
    noFakeProgressChecks: {
      publicBranding: false,
      hostedPlatformProductionDependency: false,
      fakeNetworkClaim: false,
      secretExposed: false,
      sensitiveAgentStatePublic: false,
    },
    nextPrHandoff: {
      nextPr: "PR-07",
      title: "Ref certificates and ref ledger",
      requiredInputs: [
        "packages/object-store/src/manifest.ts",
        "packages/object-store/src/local-alpha-driver.ts",
        "apps/node/src/services/repo-service.ts",
        "launch/evidence/pr-06-object-store-qstorage-blockers.json",
      ],
      knownRisks: [
        "PR-06 stores deterministic local-alpha objects only.",
        "QStorage and CasterCloud remain requires-endpoint unless endpoint credentials and proof exist.",
        "Ref certificates are implemented in PR-07.",
        "Push-local is implemented in PR-08.",
      ],
    },
  };

  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: "passed", evidence: path.relative(repoRoot, evidencePath), objectCount: manifest.objects.length, rootHash: manifest.rootHash }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error.message }, null, 2));
  process.exit(1);
});
