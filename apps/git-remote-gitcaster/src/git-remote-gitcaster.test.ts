import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";
import { explainFetchBlocked } from "./fetch.js";
import { handleGitRemoteHelperSession } from "./index.js";
import { resolveGitCasterNodeUrl } from "./node-client.js";
import { parseGitCasterUrl } from "./protocol.js";
import { explainPushBlocked } from "./push.js";

test("parses base gitcaster URL", () => {
  const parsed = parseGitCasterUrl("gitcaster://did:caster:zExample/hello-gitcaster");
  assert.equal(parsed.protocol, "gitcaster");
  assert.equal(parsed.nodeHint, null);
  assert.equal(parsed.ownerDid, "did:caster:zExample");
  assert.equal(parsed.repo, "hello-gitcaster");
  assert.equal(parsed.repoId, "gitcaster://did:caster:zExample/hello-gitcaster");
});

test("parses .git suffix and strips it", () => {
  const parsed = parseGitCasterUrl("gitcaster://did:caster:zExample/hello-gitcaster.git");
  assert.equal(parsed.repo, "hello-gitcaster");
});

test("parses node hint URL shape", () => {
  const parsed = parseGitCasterUrl("gitcaster://node.gitcaster.casterchain/did:caster:zExample/hello-gitcaster");
  assert.equal(parsed.nodeHint, "node.gitcaster.casterchain");
});

test("rejects non-gitcaster protocol", () => {
  assert.throws(() => parseGitCasterUrl("gitlawb://did:gitlawb:zExample/hello"));
});

test("rejects did:gitlawb owner", () => {
  assert.throws(() => parseGitCasterUrl("gitcaster://did:gitlawb:zExample/hello"));
});

test("rejects missing repo", () => {
  assert.throws(() => parseGitCasterUrl("gitcaster://did:caster:zExample"));
});

test("rejects unsafe repo name", () => {
  assert.throws(() => parseGitCasterUrl("gitcaster://did:caster:zExample/../bad"));
});

test("node resolver reads GitCaster env names", () => {
  assert.equal(resolveGitCasterNodeUrl({ GITCASTER_NODE: "http://127.0.0.1:4123" }), "http://127.0.0.1:4123");
  assert.equal(resolveGitCasterNodeUrl({ CASTER_NODE_URL: "http://127.0.0.1:4124" }), "http://127.0.0.1:4124");
});

test("node resolver ignores legacy env names", () => {
  assert.equal(resolveGitCasterNodeUrl({ GITLAWB_NODE: "http://127.0.0.1:4125" } as NodeJS.ProcessEnv), null);
});

test("push and fetch handlers are blocked without success claims", () => {
  const push = explainPushBlocked();
  const fetch = explainFetchBlocked();
  assert.equal(push.status, "blocked");
  assert.equal(fetch.status, "blocked");
  assert.equal(push.normalGitPushClaimed, false);
  assert.equal(fetch.normalGitCloneClaimed, false);
});

test("helper capabilities do not advertise push or fetch", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  let text = "";
  output.on("data", (chunk) => {
    text += chunk.toString("utf8");
  });
  const session = handleGitRemoteHelperSession({
    argv: ["origin", "gitcaster://did:caster:zExample/hello-gitcaster"],
    input,
    output,
    env: {},
  });
  input.write("capabilities\n");
  input.end();
  await session;
  assert.match(text, /\blist\b/);
  assert.doesNotMatch(text, /\bpush\b/);
  assert.doesNotMatch(text, /\bfetch\b/);
});
