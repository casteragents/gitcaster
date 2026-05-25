import { createHash } from "node:crypto";
import type { SignedMutationEnvelope } from "../../protocol/dist/types.js";

export interface SignedRecord {
  type: "gitcaster.signed-record.v1";
  actor: string;
  payloadHash: string;
  signature: string | null;
  signatureStatus: "signed" | "unsigned" | "fixture-only";
  timestamp: string;
  publicFingerprint?: string;
}

export function recordSignatureStatus(record: SignedRecord): "signed" | "unsigned" | "fixture-only" {
  return record.signatureStatus;
}

export function createSignedRecordFromEnvelope(args: { envelope: SignedMutationEnvelope; publicKeyPem?: string }): SignedRecord {
  return {
    type: "gitcaster.signed-record.v1",
    actor: args.envelope.actor,
    payloadHash: args.envelope.payloadHash,
    signature: args.envelope.signature || null,
    signatureStatus: args.envelope.signature ? "signed" : "unsigned",
    timestamp: args.envelope.timestamp,
    publicFingerprint: args.publicKeyPem ? `sha256:${createHash("sha256").update(args.publicKeyPem).digest("hex").slice(0, 24)}` : undefined,
  };
}

export function redactSignedRecord(record: SignedRecord): SignedRecord {
  return {
    ...record,
    signature: record.signature ? "[redacted-signature]" : null,
  };
}
