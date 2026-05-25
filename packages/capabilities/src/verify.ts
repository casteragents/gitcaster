import { verify } from "node:crypto";
import type { CasterCapability } from "../../protocol/dist/types.js";
import { canonicalizeCapability, isCapabilityExpired } from "./capability.js";
import { isCasterCapabilityScope } from "./scopes.js";

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${pad}`, "base64");
}

export interface CapabilityVerificationResult {
  ok: boolean;
  status: "verified" | "blocked" | "error";
  errors: string[];
  scope?: string;
  resource?: string;
}

export function verifyCapability(args: { capability: CasterCapability; publicKeyPem?: string; expectedScope?: string; expectedResourcePrefix?: string; now?: Date }): CapabilityVerificationResult {
  const errors: string[] = [];
  const capability = args.capability;
  if (capability.type !== "gitcaster.capability.v1") errors.push("invalid capability type");
  if (!capability.issuer.startsWith("did:caster:")) errors.push("issuer must be did:caster");
  if (!capability.subject.startsWith("did:caster:")) errors.push("subject must be did:caster");
  if (!isCasterCapabilityScope(capability.scope)) errors.push("scope denied");
  if (!capability.resource) errors.push("resource missing");
  if (isCapabilityExpired(capability, args.now)) errors.push("capability expired");
  if (!capability.nonce) errors.push("nonce missing");
  if (capability.status === "blocked" || capability.status === "error") errors.push("status blocked");
  if (!capability.signature) errors.push("signature missing");
  if (args.expectedScope && capability.scope !== args.expectedScope) errors.push("expected scope mismatch");
  if (args.expectedResourcePrefix && !capability.resource.startsWith(args.expectedResourcePrefix)) errors.push("resource prefix mismatch");
  if (args.publicKeyPem && capability.signature) {
    const unsigned = { ...capability, signature: "" };
    const ok = verify(null, Buffer.from(canonicalizeCapability(unsigned)), args.publicKeyPem, fromBase64Url(capability.signature));
    if (!ok) errors.push("signature invalid");
  }
  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? "verified" : "blocked",
    errors,
    scope: capability.scope,
    resource: capability.resource,
  };
}
