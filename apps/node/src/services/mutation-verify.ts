import type { CasterCapabilityScope, SignedMutationEnvelope } from "../../../../packages/protocol/dist/types.js";
import { verifySignedMutationEnvelope } from "../../../../packages/identity/dist/index.js";
import { verifyCapability } from "../../../../packages/capabilities/dist/index.js";
import { assertFreshNonce, checkTimestampSkew } from "../../../../packages/security/dist/index.js";
import type { LocalAlphaStore } from "./local-alpha-store.js";

export interface NodeMutationVerificationResult {
  ok: boolean;
  status: "verified" | "blocked" | "error";
  actor?: string;
  scope?: string;
  errors: string[];
  envelope?: SignedMutationEnvelope;
}

export function requiredScopeForRoute(method: string, pathname: string): CasterCapabilityScope | null {
  const key = `${method.toUpperCase()} ${pathname}`;
  if (key === "POST /identity/register") return "node:register";
  if (key === "POST /repos") return "repo:create";
  if (/^POST \/repos\/[^/]+\/[^/]+\/push-local$/.test(key)) return "repo:write";
  if (/^POST \/repos\/[^/]+\/[^/]+\/refs\/update$/.test(key)) return "ref:update";
  if (/^POST \/repos\/[^/]+\/[^/]+\/issues$/.test(key)) return "issue:write";
  if (/^PATCH \/repos\/[^/]+\/[^/]+\/issues\/[^/]+$/.test(key)) return "issue:write";
  if (/^POST \/repos\/[^/]+\/[^/]+\/prs$/.test(key)) return "pr:write";
  if (/^POST \/repos\/[^/]+\/[^/]+\/prs\/[^/]+\/review$/.test(key)) return "pr:write";
  if (/^POST \/repos\/[^/]+\/[^/]+\/prs\/[^/]+\/merge$/.test(key)) return "pr:merge";
  if (key === "POST /qstorage/publish" || key === "POST /qstorage/verify") return "deploy:qstorage";
  if (key === "POST /castercloud/deploy" || key === "POST /castercloud/verify") return "deploy:castercloud";
  if (key === "POST /ecosystem/import" || key === "POST /ecosystem/submit") return "ecosystem:submit";
  if (key === "POST /miniapps/import" || key === "POST /miniapps/compat") return "miniapp:import";
  if (key === "POST /domains/request") return "domain:request";
  return null;
}

export function extractEnvelopeFromBody(body: unknown): SignedMutationEnvelope | null {
  if (!body || typeof body !== "object") return null;
  const candidate = (body as { envelope?: unknown }).envelope || body;
  if (candidate && typeof candidate === "object" && (candidate as { type?: string }).type === "gitcaster.signed-mutation.v1") {
    return candidate as SignedMutationEnvelope;
  }
  return null;
}

export function publicKeyFromRegisteredIdentity(store: LocalAlphaStore, actor: string): string | null {
  return store.identities.get(actor)?.publicKeyPem || null;
}

export function redactVerificationError(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactVerificationError);
  if (typeof value === "string") return value.replace(/-----BEGIN[\s\S]*?KEY-----/g, "[redacted-key]");
  return value;
}

export async function verifyNodeMutationRequest(args: { method: string; pathname: string; body: unknown; store: LocalAlphaStore }): Promise<NodeMutationVerificationResult> {
  const errors: string[] = [];
  const scope = requiredScopeForRoute(args.method, args.pathname);
  const envelope = extractEnvelopeFromBody(args.body);
  if (!scope) return { ok: true, status: "verified", errors: [] };
  if (!envelope) return { ok: false, status: "blocked", scope, errors: ["signed mutation envelope required"] };
  if (!envelope.actor.startsWith("did:caster:")) errors.push("actor must be did:caster");
  const payload = envelope.payload as Record<string, unknown>;
  const embeddedPublicKey = typeof payload.publicKeyPem === "string" ? payload.publicKeyPem : null;
  const publicKeyPem = publicKeyFromRegisteredIdentity(args.store, envelope.actor) || (args.pathname === "/identity/register" ? embeddedPublicKey : null);
  if (!publicKeyPem) errors.push("actor public key not registered");
  if (publicKeyPem) {
    const envelopeResult = verifySignedMutationEnvelope({ envelope, publicKeyPem, expectedScope: scope });
    if (!envelopeResult.ok) errors.push(...envelopeResult.errors);
    const capabilityResult = envelope.capability ? verifyCapability({ capability: envelope.capability, publicKeyPem, expectedScope: scope, expectedResourcePrefix: "gitcaster://" }) : { ok: false, errors: ["capability missing"] };
    if (!capabilityResult.ok) errors.push(...capabilityResult.errors);
  }
  const timestamp = checkTimestampSkew(envelope.timestamp);
  if (!timestamp.ok) errors.push(timestamp.error || "timestamp skew");
  const nonce = assertFreshNonce(args.store.nonces, envelope.nonce);
  if (!nonce.ok) errors.push(nonce.error || "nonce replay");
  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? "verified" : "blocked",
    actor: envelope.actor,
    scope,
    errors,
    envelope,
  };
}
