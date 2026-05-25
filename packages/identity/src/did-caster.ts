import type { CasterDID } from "../../protocol/dist/types.js";
import { publicKeyFingerprint } from "./ed25519.js";

export interface CasterDIDDocument {
  id: string;
  method: "caster";
  verificationMethod: Array<{
    id: string;
    type: "Ed25519VerificationKey2020";
    controller: string;
    publicKeyMultibase: string;
  }>;
  capabilityInvocation: string[];
  createdAt: string;
  kind: "human" | "agent" | "node";
}

export function createCasterDIDFromPublicKey(publicKeyPem: string, kind: "human" | "agent" | "node" = "human"): CasterDID {
  const fingerprint = publicKeyFingerprint(publicKeyPem);
  return {
    id: `did:caster:${fingerprint}`,
    method: "caster",
    publicKey: publicKeyPem,
    createdAt: new Date().toISOString(),
    kind,
    capabilities: [],
    trustScore: 0,
    status: "alpha-local",
  };
}

export function createCasterDIDDocument(args: { did: string; publicKeyPem: string; kind?: "human" | "agent" | "node"; createdAt?: string }): CasterDIDDocument {
  assertCasterDID(args.did);
  const keyId = `${args.did}#ed25519`;
  return {
    id: args.did,
    method: "caster",
    verificationMethod: [
      {
        id: keyId,
        type: "Ed25519VerificationKey2020",
        controller: args.did,
        publicKeyMultibase: publicKeyFingerprint(args.publicKeyPem),
      },
    ],
    capabilityInvocation: [keyId],
    createdAt: args.createdAt || new Date().toISOString(),
    kind: args.kind || "human",
  };
}

export function isCasterDID(value: string): boolean {
  return /^did:caster:z[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

export function assertCasterDID(value: string): void {
  if (!isCasterDID(value)) throw new Error(`Invalid CasterDID: ${value}`);
}
