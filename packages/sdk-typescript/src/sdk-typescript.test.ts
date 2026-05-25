import assert from "node:assert/strict";
import test from "node:test";
import { createGitCasterClient, redactGitCasterValue } from "./index.js";

const legacyProtocol = "git" + "lawb://";
const legacyDid = "did:" + "gitlawb";
const legacyToken = "$" + "GITLAWB";

test("client without node blocks nodeHealth", async () => {
  const result = await createGitCasterClient().nodeHealth();
  assert.equal(result.ok, false);
  assert.equal(result.status, "requires-node");
});

test("client uses provided node URL for nodeHealth", async () => {
  const urls: string[] = [];
  const client = createGitCasterClient({
    nodeUrl: "http://127.0.0.1:8787",
    fetchImpl: async (url) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
  });
  const result = await client.nodeHealth();
  assert.equal(result.ok, true);
  assert.equal(urls[0], "http://127.0.0.1:8787/health");
});

test("client never reads legacy node env", async () => {
  const before = process.env["GIT" + "LAWB_NODE"];
  process.env["GIT" + "LAWB_NODE"] = "http://legacy.invalid";
  try {
    const result = await createGitCasterClient().repoList();
    assert.equal(result.ok, false);
    assert.equal(result.status, "requires-node");
  } finally {
    if (before === undefined) delete process.env["GIT" + "LAWB_NODE"];
    else process.env["GIT" + "LAWB_NODE"] = before;
  }
});

test("repoList blocks without node URL", async () => {
  const result = await createGitCasterClient().repoList();
  assert.equal(result.ok, false);
  assert.equal(result.status, "requires-node");
});

test("mutating methods block without signer", async () => {
  const client = createGitCasterClient({ nodeUrl: "http://127.0.0.1:8787" });
  assert.equal((await client.repoCreate({ name: "demo" })).status, "requires-signing-key");
  assert.equal((await client.issueCreate("caster", "demo", { title: "Issue" })).status, "requires-signing-key");
  assert.equal((await client.prCreate("caster", "demo", { title: "PR" })).status, "requires-signing-key");
});

test("proof methods do not claim live verification", () => {
  const client = createGitCasterClient();
  assert.equal(client.qstorageStatus().status, "requires-verification-proof");
  assert.equal(client.castercloudStatus().status, "requires-verification-proof");
  assert.equal(client.publicNodeStatus().status, "requires-federation-proof");
});

test("token and domain helpers stay proof-gated", () => {
  const client = createGitCasterClient();
  const token = client.tokenInfo();
  assert.equal(token.ok, true);
  assert.equal(token.status, "proof-only");
  assert.equal(token.value.symbol, "$CASTER");
  assert.equal(token.value.staking, "requires-contract");
  assert.equal(client.domainStatus("caster").status, "requires-registry");
});

test("clone URL helper uses GitCaster protocol only", () => {
  const result = createGitCasterClient().repoCloneUrl("alice", "demo");
  assert.equal(result.ok, true);
  assert.equal(result.value.cloneUrl, "gitcaster://alice/demo");
  const generated = JSON.stringify(result);
  assert.equal(generated.includes(legacyProtocol), false);
  assert.equal(generated.includes(legacyDid), false);
  assert.equal(generated.includes(legacyToken), false);
});

test("redaction removes secret-looking values", () => {
  const redacted = redactGitCasterValue("Authorization: " + "Bearer abcdef123456 token=abcdef1234567890");
  assert.equal(redacted.includes("abcdef123456"), false);
  assert.match(redacted, /\[redacted\]/);
});

test("no method returns a production status", async () => {
  const client = createGitCasterClient();
  const results = [
    await client.nodeHealth(),
    await client.repoList(),
    await client.repoCreate({ name: "demo" }),
    client.qstorageStatus(),
    client.castercloudStatus(),
    client.tokenInfo(),
    client.domainStatus("caster"),
  ];
  for (const result of results) {
    assert.notEqual(result.status, "production");
    assert.notEqual(result.status, "production-ready");
    assert.notEqual(result.status, "deployed");
    assert.notEqual(result.status, "verified");
  }
});
