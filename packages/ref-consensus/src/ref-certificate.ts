import type { CasterCapability, RefUpdateCertificate, SignatureRecord } from "../../protocol/dist/types.js";
import { canonicalize, signEd25519, verifyEd25519 } from "../../identity/dist/index.js";
import { sha256Object } from "../../object-store/dist/index.js";

export interface RefCertificateInput {
  repo: string;
  ref: string;
  from: string | null;
  to: string;
  objectCids: string[];
  actor: string;
  node: string;
  timestamp?: string;
  nonce?: string;
  capability?: CasterCapability;
  actorSignature?: string;
  actorPrivateKeyPem?: string;
  actorPublicKeyPem?: string;
  nodePrivateKeyPem?: string;
  nodeSignature?: string;
}

export interface RefCertificateIssueResult {
  ok: boolean;
  status: "alpha-local" | "blocked" | "error";
  certificate?: RefUpdateCertificate;
  errors: string[];
}

export function createRefCertificatePayload(args: RefCertificateInput): Omit<RefUpdateCertificate, "signatures" | "status"> {
  return {
    type: "gitcaster.ref.update.v1",
    repo: args.repo,
    ref: args.ref,
    from: args.from,
    to: args.to,
    objectCids: [...args.objectCids],
    actor: args.actor,
    node: args.node,
    timestamp: args.timestamp || new Date().toISOString(),
    nonce: args.nonce || `ref-${Date.now()}`,
    capability: args.capability,
    payloadHash: "",
  };
}

export function refCertificatePayloadHash(args: RefCertificateInput | Omit<RefUpdateCertificate, "signatures" | "status">): string {
  const payload = {
    type: "gitcaster.ref.update.v1",
    repo: args.repo,
    ref: args.ref,
    from: args.from,
    to: args.to,
    objectCids: [...args.objectCids],
    actor: args.actor,
    node: args.node,
    timestamp: args.timestamp,
    nonce: args.nonce,
    capability: args.capability,
  };
  return sha256Object(payload);
}

export function validateRefCertificateFields(args: RefCertificateInput): string[] {
  const errors: string[] = [];
  if (!args.repo.startsWith("gitcaster://did:caster:")) errors.push("repo must use gitcaster protocol and Caster DID");
  if (!args.actor.startsWith("did:caster:")) errors.push("actor must be did:caster");
  if (!args.node.startsWith("did:caster:")) errors.push("node must be did:caster");
  if (!args.ref.startsWith("refs/heads/")) errors.push("ref must start with refs/heads/");
  if (!(args.to.startsWith("sha256:") || args.to.startsWith("casterobj:"))) errors.push("to must be sha256 or caster object URI");
  if (!args.objectCids.length) errors.push("objectCids must be non-empty");
  for (const cid of args.objectCids) {
    if (!(cid.startsWith("sha256:") || cid.startsWith("casterobj:"))) errors.push(`objectCid is structurally invalid: ${cid}`);
  }
  return errors;
}

export async function issueRefUpdateCertificate(args: RefCertificateInput): Promise<RefCertificateIssueResult> {
  const errors = validateRefCertificateFields(args);
  const basePayload = createRefCertificatePayload(args);
  const payloadHash = refCertificatePayloadHash({ ...basePayload, payloadHash: "" });
  const actorSignature = args.actorSignature || (args.actorPrivateKeyPem ? signEd25519(args.actorPrivateKeyPem, payloadHash) : "");
  if (!actorSignature) errors.push("actor signature missing");
  if (args.actorPublicKeyPem && actorSignature && !verifyEd25519(args.actorPublicKeyPem, payloadHash, actorSignature)) errors.push("actor signature invalid");
  if (errors.length) return { ok: false, status: "blocked", errors };
  const signatures: SignatureRecord[] = [{ signer: args.actor, alg: "ed25519", sig: actorSignature, signedAt: basePayload.timestamp }];
  const nodeSignature = args.nodeSignature || (args.nodePrivateKeyPem ? signEd25519(args.nodePrivateKeyPem, payloadHash) : "");
  if (!nodeSignature) return { ok: false, status: "blocked", errors: ["node signature missing"] };
  signatures.push({ signer: args.node, alg: "ed25519", sig: nodeSignature, signedAt: basePayload.timestamp });
  return {
    ok: true,
    status: "alpha-local",
    errors: [],
    certificate: {
      ...basePayload,
      payloadHash,
      signatures,
      status: "alpha-local",
    },
  };
}

export function redactRefCertificate(cert: RefUpdateCertificate): RefUpdateCertificate {
  return {
    ...cert,
    signatures: cert.signatures.map((signature) => ({ ...signature, sig: signature.sig ? "[redacted-signature]" : "" })),
  };
}

export function canonicalRefCertificateSigningPayload(args: RefCertificateInput): string {
  return canonicalize(createRefCertificatePayload(args));
}
