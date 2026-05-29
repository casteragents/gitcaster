import { createGitCasterClient, redactGitCasterValue } from "./index.js";

const legacyProtocol = "git" + "lawb://";
const legacyDid = "did:" + "gitlawb";
const legacyToken = "$" + "GITLAWB";
const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

async function run(): Promise<void> {
  const missingNode = await createGitCasterClient().nodeHealth();
  assertEqual(missingNode.ok, false, "client without node should block nodeHealth");
  assertEqual(missingNode.status, "requires-node", "nodeHealth should require node");

  const urls: string[] = [];
  const clientWithFetch = createGitCasterClient({
    nodeUrl: "http://127.0.0.1:8787",
    fetchImpl: async (url) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
  });
  const health = await clientWithFetch.nodeHealth();
  assertEqual(health.ok, true, "client should use provided node URL");
  assertEqual(urls[0], "http://127.0.0.1:8787/health", "nodeHealth should call health path");

  const env = runtime.process?.env;
  const key = "GIT" + "LAWB_NODE";
  const before = env?.[key];
  if (env) env[key] = "http://legacy.invalid";
  try {
    const repoList = await createGitCasterClient().repoList();
    assertEqual(repoList.ok, false, "client should ignore legacy node env");
    assertEqual(repoList.status, "requires-node", "repoList should still require GitCaster node");
  } finally {
    if (env) {
      if (before === undefined) delete env[key];
      else env[key] = before;
    }
  }

  const client = createGitCasterClient({ nodeUrl: "http://127.0.0.1:8787" });
  assertEqual((await client.repoCreate({ name: "demo" })).status, "requires-signing-key", "repoCreate should require signer");
  assertEqual((await client.issueCreate("caster", "demo", { title: "Issue" })).status, "requires-signing-key", "issueCreate should require signer");
  assertEqual((await client.prCreate("caster", "demo", { title: "PR" })).status, "requires-signing-key", "prCreate should require signer");

  const proofClient = createGitCasterClient();
  assertEqual(proofClient.qstorageStatus().status, "requires-verification-proof", "qstorage must remain proof-gated");
  assertEqual(proofClient.castercloudStatus().status, "requires-verification-proof", "castercloud must remain proof-gated");
  assertEqual(proofClient.publicNodeStatus().status, "requires-federation-proof", "public node status must remain proof-gated");

  const token = proofClient.tokenInfo();
  assertEqual(token.ok, true, "token helper should return proof-only info");
  assertEqual(token.status, "proof-only", "token helper should remain proof-only");
  assert(token.ok && token.value.symbol === "$GITCASTER", "token symbol should be $GITCASTER");
  assert(token.ok && token.value.address === "0x764697544F09921c3c8bA89F1Fb6388C4127fB07", "token address should match current public address");
  assert(token.ok && token.value.staking === "requires-contract", "staking should require contract proof");
  assertEqual(proofClient.domainStatus("caster").status, "requires-registry", "domain status should require registry");

  const clone = proofClient.repoCloneUrl("alice", "demo");
  assertEqual(clone.ok, true, "clone URL helper should be local");
  assert(clone.ok && clone.value.cloneUrl === "gitcaster://alice/demo", "clone URL helper should use GitCaster protocol");
  const generated = JSON.stringify(clone);
  assert(!generated.includes(legacyProtocol), "generated clone URL should not include legacy protocol");
  assert(!generated.includes(legacyDid), "generated clone URL should not include legacy DID");
  assert(!generated.includes(legacyToken), "generated clone URL should not include legacy token");

  const redacted = redactGitCasterValue("Authorization: " + "Bearer abcdef123456 token=abcdef1234567890");
  assert(!redacted.includes("abcdef123456"), "redaction should remove token text");
  assert(redacted.includes("[redacted]"), "redaction should include redacted marker");

  const results = [
    await proofClient.nodeHealth(),
    await proofClient.repoList(),
    await proofClient.repoCreate({ name: "demo" }),
    proofClient.qstorageStatus(),
    proofClient.castercloudStatus(),
    proofClient.tokenInfo(),
    proofClient.domainStatus("caster"),
  ];
  for (const result of results) {
    const status = String(result.status);
    assert(status !== "production", "SDK must not return production status");
    assert(status !== "production-ready", "SDK must not return production-ready status");
    assert(status !== "deployed", "SDK must not return deployed status");
    assert(status !== "verified", "SDK must not return verified status");
  }
}

await run();
console.log(JSON.stringify({ status: "passed", package: "@gitcaster/sdk", runtimeClaims: "proof-gated" }));
