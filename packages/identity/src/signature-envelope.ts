import fs from "node:fs";
import type { CasterCapability, SignedMutationEnvelope } from "../../protocol/dist/types.js";
import { canonicalize, sha256Uri } from "./canonical-json.js";
import { assertCasterDID } from "./did-caster.js";
import { signEd25519, verifyEd25519 } from "./ed25519.js";

export interface SignedMutationVerificationResult {
  ok: boolean;
  status: "verified" | "blocked" | "error";
  actor: string;
  payloadHash: string;
  errors: string[];
}

export interface FileSignature {
  path: string;
  hash: string;
  signature: string;
  signer: string;
  alg: "ed25519";
}

export function payloadHash(payload: Record<string, unknown>): string {
  return sha256Uri(canonicalize(payload));
}

export function createSignedMutationEnvelope(args: { actor: string; privateKeyPem: string; payload: Record<string, unknown>; capability?: CasterCapability; previousHash?: string | null; timestamp?: string; nonce?: string }): SignedMutationEnvelope {
  assertCasterDID(args.actor);
  const timestamp = args.timestamp || new Date().toISOString();
  const nonce = args.nonce || `nonce-${Date.now()}`;
  const hash = payloadHash(args.payload);
  const signingPayload = canonicalize({
    actor: args.actor,
    capability: args.capability,
    payload: args.payload,
    payloadHash: hash,
    previousHash: args.previousHash ?? null,
    timestamp,
    nonce,
  });
  return {
    type: "gitcaster.signed-mutation.v1",
    actor: args.actor,
    capability: args.capability,
    payload: args.payload,
    payloadHash: hash,
    previousHash: args.previousHash ?? null,
    timestamp,
    nonce,
    signature: signEd25519(args.privateKeyPem, signingPayload),
    status: "alpha-local",
  };
}

export function verifySignedMutationEnvelope(args: { envelope: SignedMutationEnvelope; publicKeyPem: string; now?: Date; expectedScope?: string }): SignedMutationVerificationResult {
  const errors: string[] = [];
  const envelope = args.envelope;
  try {
    assertCasterDID(envelope.actor);
  } catch (error) {
    errors.push((error as Error).message);
  }
  const expectedHash = payloadHash(envelope.payload);
  if (envelope.payloadHash !== expectedHash) errors.push("payload hash mismatch");
  if (!envelope.timestamp) errors.push("timestamp missing");
  if (!envelope.nonce) errors.push("nonce missing");
  if (envelope.capability) {
    if (envelope.capability.subject !== envelope.actor) errors.push("capability subject mismatch");
    if (new Date(envelope.capability.expiresAt).getTime() <= (args.now || new Date()).getTime()) errors.push("capability expired");
    if (!envelope.capability.scope) errors.push("capability scope missing");
    if (envelope.capability.status === "blocked" || envelope.capability.status === "error") errors.push("capability status blocked");
    if (args.expectedScope && envelope.capability.scope !== args.expectedScope) errors.push("capability scope mismatch");
  }
  const signingPayload = canonicalize({
    actor: envelope.actor,
    capability: envelope.capability,
    payload: envelope.payload,
    payloadHash: envelope.payloadHash,
    previousHash: envelope.previousHash ?? null,
    timestamp: envelope.timestamp,
    nonce: envelope.nonce,
  });
  if (!verifyEd25519(args.publicKeyPem, signingPayload, envelope.signature)) errors.push("signature invalid");
  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? "verified" : "blocked",
    actor: envelope.actor,
    payloadHash: expectedHash,
    errors,
  };
}

export function signFile(args: { path: string; signer: string; privateKeyPem: string }): FileSignature {
  const bytes = fs.readFileSync(args.path);
  const hash = sha256Uri(bytes);
  return {
    path: args.path,
    hash,
    signature: signEd25519(args.privateKeyPem, hash),
    signer: args.signer,
    alg: "ed25519",
  };
}

export function verifyFileSignature(args: { fileSignature: FileSignature; publicKeyPem: string }): boolean {
  const bytes = fs.readFileSync(args.fileSignature.path);
  const hash = sha256Uri(bytes);
  return hash === args.fileSignature.hash && verifyEd25519(args.publicKeyPem, hash, args.fileSignature.signature);
}
