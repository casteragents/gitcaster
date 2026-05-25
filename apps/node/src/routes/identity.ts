import { createHash } from "node:crypto";
import type { GitCasterEvent } from "../../../../packages/protocol/dist/types.js";
import type { RouteRegistry } from "../services/route-registry.js";
import { appendEvent, registerIdentity } from "../services/local-alpha-store.js";

function publicFingerprint(publicKeyPem: string): string {
  return `sha256:${createHash("sha256").update(publicKeyPem).digest("hex").slice(0, 24)}`;
}

export function registerIdentityRoutes(registry: RouteRegistry): void {
  registry.add("POST", "/identity/register", ({ body, store, verifiedMutation }) => {
    const envelope = verifiedMutation?.envelope;
    const payload = (envelope?.payload || (body as Record<string, unknown>) || {}) as Record<string, unknown>;
    const did = typeof payload.did === "string" ? payload.did : envelope?.actor || "";
    const publicKeyPem = typeof payload.publicKeyPem === "string" ? payload.publicKeyPem : "";
    const kind = payload.kind === "agent" || payload.kind === "node" ? payload.kind : "human";
    const displayName = typeof payload.displayName === "string" ? payload.displayName : undefined;
    registerIdentity(store, {
      did,
      publicKeyPem,
      displayName,
      kind,
      registeredAt: new Date().toISOString(),
    });
    const event: GitCasterEvent = {
      type: kind === "agent" ? "gitcaster.agent.joined.v1" : "gitcaster.node.announced.v1",
      id: `event-identity-${createHash("sha256").update(`${did}:${Date.now()}`).digest("hex").slice(0, 12)}`,
      actor: did,
      payload: {
        did,
        kind,
        displayName: displayName || null,
        publicKeyFingerprint: publicFingerprint(publicKeyPem),
      },
      timestamp: new Date().toISOString(),
      signature: null,
      status: "alpha-local",
    };
    appendEvent(store, event);
    return {
      statusCode: 200,
      body: {
        type: "gitcaster.identity.registered.v1",
        status: "alpha-local",
        did,
        registered: true,
        notice: "Registered on local alpha node only.",
      },
    };
  });
}
