import { createHash, sign } from "node:crypto";
import type { CasterCapability } from "../../protocol/dist/types.js";
import type { CasterCapabilityScope } from "./scopes.js";

function canonicalize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter((key) => key !== "signature" && typeof record[key] !== "undefined").sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  throw new TypeError("Unsupported canonical value");
}

function toBase64Url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function createUnsignedCapability(args: { issuer: string; subject: string; scope: CasterCapabilityScope; resource: string; expiresAt: string; nonce: string; status?: CasterCapability["status"] }): CasterCapability {
  if (!args.issuer.startsWith("did:caster:")) throw new Error("issuer must be did:caster");
  if (!args.subject.startsWith("did:caster:")) throw new Error("subject must be did:caster");
  return {
    type: "gitcaster.capability.v1",
    issuer: args.issuer,
    subject: args.subject,
    scope: args.scope,
    resource: args.resource,
    expiresAt: args.expiresAt,
    nonce: args.nonce,
    signature: "",
    status: args.status || "alpha-local",
  };
}

export function capabilityPayloadHash(capabilityWithoutSignature: CasterCapability): string {
  return `sha256:${createHash("sha256").update(canonicalize(capabilityWithoutSignature)).digest("hex")}`;
}

export function signCapability(args: { capability: CasterCapability; privateKeyPem: string }): CasterCapability {
  const payload = canonicalize(args.capability);
  return {
    ...args.capability,
    signature: toBase64Url(sign(null, Buffer.from(payload), args.privateKeyPem)),
  };
}

export function isCapabilityExpired(capability: CasterCapability, now: Date = new Date()): boolean {
  return new Date(capability.expiresAt).getTime() <= now.getTime();
}

export function redactCapability(capability: CasterCapability): CasterCapability {
  return { ...capability, signature: "[redacted]" };
}

export { canonicalize as canonicalizeCapability };
