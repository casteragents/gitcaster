import assert from "node:assert/strict";
import test from "node:test";
import { createGitCasterMcpServer, handleMcpRequest } from "./server.js";
import { callTool, listTools } from "./tool-registry.js";
import { resolveGitCasterNodeUrl } from "./node-client.js";
import { REQUIRED_BETA_TOOLS } from "./schemas.js";

const context = createGitCasterMcpServer({ env: {}, cwd: process.cwd(), timeoutMs: 100 });

test("initialize returns GitCaster server info", async () => {
  const result = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "initialize" }, context) as { serverInfo: { name: string } };
  assert.equal(result.serverInfo.name, "gitcaster");
});

test("tools/list includes all required beta tools and no legacy names", () => {
  const tools = listTools(context);
  const names = tools.map((tool) => tool.name);
  assert.deepEqual([...names].sort(), [...REQUIRED_BETA_TOOLS].sort());
  assert.equal(new RegExp(`git${"lawb"}`, "i").test(JSON.stringify(tools)), false);
});

test("unknown tool returns structured blocker", async () => {
  const result = await callTool("unknown_tool", {}, context);
  assert.equal(result.status, "blocked");
});

test("node resolver reads GitCaster env names and ignores legacy env", () => {
  assert.equal(resolveGitCasterNodeUrl({ GITCASTER_NODE: "http://127.0.0.1:8787" }), "http://127.0.0.1:8787");
  assert.equal(resolveGitCasterNodeUrl({ CASTER_NODE_URL: "http://127.0.0.1:8788" }), "http://127.0.0.1:8788");
  const legacyKey = "GIT" + "LAWB_NODE";
  assert.equal(resolveGitCasterNodeUrl({ [legacyKey]: "http://127.0.0.1:8789" }), null);
});

test("node-dependent tools block without node", async () => {
  assert.equal((await callTool("repo_list", {}, context)).status, "blocked");
  assert.equal((await callTool("node_health", {}, context)).status, "blocked");
});

test("endpoint and registry tools return honest blockers", async () => {
  assert.equal((await callTool("qstorage_verify", {}, context)).status, "requires-endpoint");
  assert.equal((await callTool("castercloud_verify", {}, context)).status, "requires-endpoint");
  assert.equal((await callTool("domain_status", {}, context)).status, "requires-registry");
});

test("token info uses caster token and avoids active utility claims", async () => {
  const result = await callTool("caster_token_info", {}, context);
  const payload = result.result as { token: string; tokenAddress: string; stakingLiveClaimed: boolean };
  assert.equal(payload.token, "$GITCASTER");
  assert.equal(payload.tokenAddress, "0x764697544F09921c3c8bA89F1Fb6388C4127fB07");
  assert.equal(payload.stakingLiveClaimed, false);
});

test("identity_show does not return private key", async () => {
  const result = await callTool("identity_show", {}, createGitCasterMcpServer({ env: { CASTER_DID: "did:caster:zExample" }, cwd: process.cwd() }));
  assert.equal(JSON.stringify(result).includes("BEGIN PRIVATE KEY"), false);
});

test("mutating tools block without signing identity", async () => {
  for (const name of ["repo_create", "issue_create", "issue_update", "pr_create", "pr_review", "pr_merge"]) {
    assert.equal((await callTool(name, {}, context)).status, "blocked");
  }
});

test("no tool returns forbidden success labels in local-only test context", async () => {
  for (const name of REQUIRED_BETA_TOOLS) {
    const result = await callTool(name, {}, context);
    assert.notEqual(result.status, "live");
    assert.notEqual(result.status, "deployed");
    assert.notEqual(result.status, "verified");
    assert.notEqual(result.status, "production");
  }
});
