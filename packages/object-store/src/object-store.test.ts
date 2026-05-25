import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  casterCloudEnvStatus,
  createCasterCloudDriver,
  createDeploymentManifestPlaceholder,
  createLocalAlphaDriver,
  createObjectManifest,
  createQStorageDriver,
  createQStorageObjectRecord,
  createRootHash,
  detectMime,
  isIgnoredObjectPath,
  qstorageEnvStatus,
  sha256Text,
  validateObjectManifest,
} from "./index.js";

const repo = "gitcaster://did:caster:zPr06Owner/hello-gitcaster";
const signedBy = "did:caster:zPr06Owner";

async function createFixture(): Promise<{ rootPath: string; stateDir: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gitcaster-pr06-fixture-"));
  const rootPath = path.join(root, "src");
  const stateDir = path.join(root, "state");
  await fs.mkdir(path.join(rootPath, "src"), { recursive: true });
  await fs.mkdir(path.join(rootPath, ".git"), { recursive: true });
  await fs.mkdir(path.join(rootPath, "node_modules", "x"), { recursive: true });
  await fs.writeFile(path.join(rootPath, "index.html"), "<!doctype html><h1>GitCaster</h1>");
  await fs.writeFile(path.join(rootPath, "src", "main.js"), "console.log('gitcaster');");
  await fs.writeFile(path.join(rootPath, "styles.css"), "body { color: #111; }");
  await fs.writeFile(path.join(rootPath, "data.json"), JSON.stringify({ app: "gitcaster" }));
  await fs.writeFile(path.join(rootPath, "README.md"), "# GitCaster\n");
  await fs.writeFile(path.join(rootPath, ".git", "config"), "[core]\n");
  await fs.writeFile(path.join(rootPath, "node_modules", "x", "index.js"), "module.exports = 1;");
  await fs.writeFile(path.join(rootPath, ".env"), "SECRET=value");
  await fs.writeFile(path.join(rootPath, "identity.pem"), "not a real key");
  return { rootPath, stateDir };
}

test("sha256 hash is deterministic", () => {
  assert.equal(sha256Text("GitCaster"), sha256Text("GitCaster"));
  assert.match(sha256Text("GitCaster"), /^sha256:[a-f0-9]{64}$/);
});

test("root hash is deterministic regardless of input order", () => {
  const a = [
    { path: "b.txt", hash: "sha256:bbb", size: 2 },
    { path: "a.txt", hash: "sha256:aaa", size: 1 },
  ];
  const b = [...a].reverse();
  assert.equal(createRootHash(a), createRootHash(b));
  assert.match(createRootHash(a), /^sha256:[a-f0-9]{64}$/);
});

test("MIME detection works for required files", () => {
  assert.equal(detectMime("index.html"), "text/html");
  assert.equal(detectMime("main.js"), "application/javascript");
  assert.equal(detectMime("styles.css"), "text/css");
  assert.equal(detectMime("data.json"), "application/json");
  assert.equal(detectMime("image.png"), "image/png");
  assert.equal(detectMime("photo.jpg"), "image/jpeg");
  assert.equal(detectMime("icon.svg"), "image/svg+xml");
  assert.equal(detectMime("note.txt"), "text/plain");
  assert.equal(detectMime("module.wasm"), "application/wasm");
});

test("ignored paths are ignored", () => {
  assert.equal(isIgnoredObjectPath(".git/config"), true);
  assert.equal(isIgnoredObjectPath("node_modules/x/index.js"), true);
  assert.equal(isIgnoredObjectPath(".env"), true);
  assert.equal(isIgnoredObjectPath("identity.pem"), true);
  assert.equal(isIgnoredObjectPath("src/main.js"), false);
});

test("local-alpha driver writes manifest and objects by hash", async () => {
  const fixture = await createFixture();
  const driver = createLocalAlphaDriver({ stateDir: fixture.stateDir });
  const result = await driver.writeBundle({ repo, commit: "commit-pr06", rootPath: fixture.rootPath, signedBy });
  assert.equal(result.status, "alpha-local");
  assert.equal(result.manifest?.type, "gitcaster.object.manifest.v1");
  assert.equal(result.manifest?.storage.status, "alpha-local");
  assert.equal(result.proof && typeof result.proof === "object" && (result.proof as { status?: string }).status, "alpha-local");
  assert.equal(result.manifest?.objects.length, 5);
  assert.equal(result.objectPaths && Array.isArray(result.objectPaths) && result.objectPaths.length, 5);
  for (const objectPath of result.objectPaths as string[]) {
    await fs.access(objectPath);
    assert.match(path.basename(objectPath), /^[a-f0-9]{64}$/);
  }
  const generated = JSON.stringify(result.manifest);
  assert.equal(new RegExp(`git${"lawb"}`, "i").test(generated), false);
  assert.equal(/production/i.test(JSON.stringify(result.proof)), false);
  assert.equal(validateObjectManifest(result.manifest!).ok, true);
});

test("manifest validation rejects wrong protocol and signer", () => {
  const object = createQStorageObjectRecord({ path: "index.html", hash: sha256Text("hello"), size: 5, mime: "text/html" });
  const wrongRepo = createObjectManifest({ repo: "https://example.invalid/repo", commit: "a", objects: [object], signedBy });
  const wrongSigner = createObjectManifest({ repo, commit: "a", objects: [object], signedBy: "did:other:zOwner" });
  assert.equal(validateObjectManifest(wrongRepo).ok, false);
  assert.equal(validateObjectManifest(wrongSigner).ok, false);
});

test("QStorage missing env returns blocker and never verifies", async () => {
  const env = {};
  const status = qstorageEnvStatus(env);
  assert.equal(status.status, "requires-endpoint");
  assert.equal(status.verified, false);
  const driver = createQStorageDriver({ env });
  const write = await driver.writeBundle({ repo, commit: "commit-pr06", rootPath: os.tmpdir(), signedBy });
  assert.equal(write.status, "requires-endpoint");
  assert.equal(write.verified, false);
});

test("QStorage token value is redacted when env is present", async () => {
  const env = {
    CASTER_QSTORAGE_ENDPOINT: "https://qstorage.invalid",
    CASTER_QSTORAGE_WRITE_TOKEN: "secret-token-value",
    CASTER_QSTORAGE_VERIFY_ENDPOINT: "https://qstorage.invalid/verify",
    CASTER_QSTORAGE_NAMESPACE: "gitcaster",
  };
  const result = await createQStorageDriver({ env }).writeBundle({ repo, commit: "commit-pr06", rootPath: os.tmpdir(), signedBy });
  assert.equal(JSON.stringify(result).includes("secret-token-value"), false);
  assert.equal(result.status, "blocked");
  assert.equal(result.verified, false);
});

test("CasterCloud missing env returns blocker and never deploys or verifies", async () => {
  const env = {};
  const status = casterCloudEnvStatus(env);
  assert.equal(status.status, "requires-endpoint");
  assert.equal(status.verified, false);
  const result = await createCasterCloudDriver({ env }).writeBundle({ repo, commit: "commit-pr06", rootPath: os.tmpdir(), signedBy });
  assert.equal(result.status, "requires-endpoint");
  assert.equal(result.verified, false);
  assert.notEqual((result.deploymentManifest as { status?: string }).status, "deployed");
});

test("CasterCloud token value is redacted when env is present", async () => {
  const env = {
    CASTER_CLOUD_DEPLOY_ENDPOINT: "https://castercloud.invalid",
    CASTER_CLOUD_DEPLOY_TOKEN: "castercloud-secret-token",
    CASTER_CLOUD_PROJECT: "gitcaster",
    CASTER_CLOUD_RELEASE_CHANNEL: "alpha",
    CASTER_DEPLOY_SIGNING_KEY_PATH: "/tmp/signing-key",
  };
  const result = await createCasterCloudDriver({ env }).writeBundle({ repo, commit: "commit-pr06", rootPath: os.tmpdir(), signedBy });
  assert.equal(JSON.stringify(result).includes("castercloud-secret-token"), false);
  assert.equal(result.status, "blocked");
  assert.equal(result.verified, false);
});

test("deployment manifest placeholder is unsigned and not verified", () => {
  const placeholder = createDeploymentManifestPlaceholder({ rootHash: "sha256:abc", fileCount: 1 });
  assert.equal(placeholder.status, "requires-endpoint");
  assert.equal(placeholder.signed, false);
  assert.equal(placeholder.signature, null);
  assert.equal((placeholder as { verified?: unknown }).verified, undefined);
});
