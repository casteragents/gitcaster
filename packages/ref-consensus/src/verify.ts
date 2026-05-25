import type { RefUpdateCertificate } from "../../protocol/dist/types.js";
import { verifyEd25519 } from "../../identity/dist/index.js";
import { refCertificatePayloadHash, validateRefCertificateFields } from "./ref-certificate.js";
import type { RefLedger } from "./ref-ledger.js";
import { getCurrentHead } from "./ref-ledger.js";

export interface RefCertificateVerificationResult {
  ok: boolean;
  status: "alpha-local" | "blocked" | "error";
  errors: string[];
}

export interface RefLedgerVerificationResult {
  ok: boolean;
  status: "alpha-local" | "blocked" | "error";
  errors: string[];
}

export async function verifyRefUpdateCertificate(args: { certificate: RefUpdateCertificate; actorPublicKeyPem?: string; nodePublicKeyPem?: string; requireNodeSignature?: boolean }): Promise<RefCertificateVerificationResult> {
  const cert = args.certificate;
  const errors: string[] = [];
  if (cert.type !== "gitcaster.ref.update.v1") errors.push("invalid certificate type");
  errors.push(...validateRefCertificateFields(cert));
  const expectedPayloadHash = refCertificatePayloadHash(cert);
  if (cert.payloadHash !== expectedPayloadHash) errors.push("payload hash mismatch");
  const actorSignature = cert.signatures.find((signature) => signature.signer === cert.actor);
  const nodeSignature = cert.signatures.find((signature) => signature.signer === cert.node);
  if (!actorSignature?.sig) errors.push("actor signature missing");
  if (!nodeSignature?.sig) errors.push("node signature missing");
  if (args.actorPublicKeyPem && actorSignature?.sig && !verifyEd25519(args.actorPublicKeyPem, cert.payloadHash, actorSignature.sig)) errors.push("actor signature invalid");
  if ((args.nodePublicKeyPem || args.requireNodeSignature) && !nodeSignature?.sig) errors.push("node signature required");
  if (args.nodePublicKeyPem && nodeSignature?.sig && !verifyEd25519(args.nodePublicKeyPem, cert.payloadHash, nodeSignature.sig)) errors.push("node signature invalid");
  const text = JSON.stringify(cert);
  if (new RegExp(`git${"lawb"}`, "i").test(text)) errors.push("forbidden reference name found");
  if (["live", "verified", "public-alpha", "production", "deployed", "mapped", "replicated"].includes(cert.status)) errors.push("forbidden live status without proof");
  return { ok: errors.length === 0, status: errors.length ? "blocked" : "alpha-local", errors };
}

export async function verifyRefLedgerChain(args: { ledger: RefLedger; actorPublicKeyPem?: string; nodePublicKeyPem?: string }): Promise<RefLedgerVerificationResult> {
  const errors: string[] = [];
  let expectedFrom: string | null = null;
  for (const entry of args.ledger.entries) {
    const cert = entry.certificate;
    if (cert.from !== expectedFrom) errors.push(`ledger chain mismatch at height ${entry.height}`);
    const result = await verifyRefUpdateCertificate({ certificate: cert, actorPublicKeyPem: args.actorPublicKeyPem, nodePublicKeyPem: args.nodePublicKeyPem, requireNodeSignature: true });
    errors.push(...result.errors.map((error) => `height ${entry.height}: ${error}`));
    expectedFrom = cert.to;
  }
  if (getCurrentHead(args.ledger, args.ledger.repo, args.ledger.ref) !== expectedFrom) errors.push("current head mismatch");
  return { ok: errors.length === 0, status: errors.length ? "blocked" : "alpha-local", errors };
}
