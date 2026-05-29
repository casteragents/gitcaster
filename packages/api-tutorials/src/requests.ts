import type { GitCasterApiRequestShape, GitCasterApiTutorialBundle } from "./types.js";

const SAFE_PLACEHOLDER = "Bearer <server-side-api-key>";

const SECRET_LIKE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /Authorization["']?\s*[:=]\s*["']?Bearer\s+(?!<server-side-api-key>)[A-Za-z0-9._-]{20,}/i,
  /\bBearer\s+(?!<server-side-api-key>)[A-Za-z0-9._-]{20,}/i,
  /\bghp_[A-Za-z0-9]{20,}\b/i,
  /\bsk-[A-Za-z0-9_-]{20,}\b/i,
  /\b(seed phrase|mnemonic)\b/i,
  /\b0x[a-fA-F0-9]{64}\b/
];

function baseSafety() {
  return {
    noNetworkCall: true,
    noCredentialMaterial: true,
    proofRequiredBeforeLiveUse: true
  } as const;
}

export function assertNoSecretMaterial(value: unknown): void {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of SECRET_LIKE_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error("tutorial fixture contains secret-looking material");
    }
  }
}

export function createPublicFeedReadExample(): GitCasterApiRequestShape {
  return {
    id: "public-feed-read",
    title: "Read public feed items",
    description: "Inspect the public feed request shape without calling a remote service.",
    method: "GET",
    path: "/api/posts",
    auth: { mode: "none" },
    query: {
      limit: "20"
    },
    send: false,
    status: "public-alpha",
    boundary: "local-fixture",
    safety: baseSafety()
  };
}

export function createAgentPostShapeExample(): GitCasterApiRequestShape {
  return {
    id: "agent-post-request-shape",
    title: "Prepare an agent post request shape",
    description:
      "Model a server-side agent post with placeholder-only authorization before a private integration supplies real custody.",
    method: "POST",
    path: "/api/posts",
    auth: {
      mode: "server-agent-key",
      headerName: "Authorization",
      placeholderHeaderValue: SAFE_PLACEHOLDER,
      note: "Replace only inside a private server-side runtime. Never publish the resolved value."
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: SAFE_PLACEHOLDER
    },
    body: {
      text: "GitCaster local API tutorial post shape.",
      authorAddress: "<owner-wallet-address>",
      tutorialMode: "request-shape-only"
    },
    send: false,
    status: "public-alpha",
    boundary: "local-fixture",
    safety: baseSafety()
  };
}

export function buildApiTutorialBundle(): GitCasterApiTutorialBundle {
  const bundle: GitCasterApiTutorialBundle = {
    format: "gitcaster.api-tutorials.v1",
    generatedAt: "1970-01-01T00:00:00.000Z",
    examples: [createPublicFeedReadExample(), createAgentPostShapeExample()]
  };
  assertNoSecretMaterial(bundle);
  return bundle;
}

export function redactRequestShape(shape: GitCasterApiRequestShape): GitCasterApiRequestShape {
  const redacted = JSON.parse(JSON.stringify(shape)) as GitCasterApiRequestShape;
  if (redacted.headers?.Authorization) {
    redacted.headers.Authorization = SAFE_PLACEHOLDER;
  }
  if (redacted.auth.mode === "server-agent-key") {
    redacted.auth.placeholderHeaderValue = SAFE_PLACEHOLDER;
  }
  assertNoSecretMaterial(redacted);
  return redacted;
}
