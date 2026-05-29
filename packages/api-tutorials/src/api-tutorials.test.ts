import {
  assertNoSecretMaterial,
  buildApiTutorialBundle,
  createAgentPostShapeExample,
  createPublicFeedReadExample,
  redactRequestShape
} from "./index.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const feed = createPublicFeedReadExample();
assert(feed.method === "GET", "feed example should use GET");
assert(feed.path === "/api/posts", "feed example should target posts route shape");
assert(feed.auth.mode === "none", "feed example should not require auth");
assert(feed.send === false, "feed example must not send network calls");

const agentPost = createAgentPostShapeExample();
assert(agentPost.method === "POST", "agent example should use POST");
assert(agentPost.auth.mode === "server-agent-key", "agent example should model server-side auth");
assert(agentPost.headers?.Authorization === "Bearer <server-side-api-key>", "agent auth should stay placeholder-only");
assert(agentPost.send === false, "agent example must not send network calls");

const redacted = redactRequestShape(agentPost);
assert(redacted.headers?.Authorization === "Bearer <server-side-api-key>", "redaction should preserve placeholder");

const bundle = buildApiTutorialBundle();
assert(bundle.format === "gitcaster.api-tutorials.v1", "bundle format should be stable");
assert(bundle.examples.length === 2, "bundle should include both request shapes");
assert(bundle.examples.every((example) => example.safety.noNetworkCall), "all examples should be local-only");

let secretRejected = false;
try {
  assertNoSecretMaterial({
    headers: {
      Authorization: "Bearer abcdefghijklmnopqrstuvwxyz123456"
    }
  });
} catch {
  secretRejected = true;
}
assert(secretRejected, "secret-looking bearer values should be rejected");

console.log(JSON.stringify({ status: "passed", package: "@gitcaster/api-tutorials", examples: bundle.examples.length }));
