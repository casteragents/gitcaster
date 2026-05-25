import type { CasterCapability, RefUpdateCertificate } from "../../protocol/dist/types.js";
import type { NonceStore } from "../../security/dist/index.js";
import { assertFreshNonce, checkTimestampSkew } from "../../security/dist/index.js";
import { verifyCapability } from "../../capabilities/dist/index.js";
import { createDoubleSignEvidence, detectDoubleSign, type DoubleSignEvidence } from "./double-sign-detect.js";
import { createRefConflictEvidence, detectRefConflict, type RefConflictEvidence } from "./conflict-resolution.js";
import { issueRefUpdateCertificate } from "./ref-certificate.js";
import { appendRefCertificate, getCurrentHead, ledgerHeight, listRefCertificates, type RefLedger } from "./ref-ledger.js";
import { DEFAULT_REF_POLICY, validateRefUpdatePolicy, type RefPolicy } from "./ref-policy.js";

export interface RefAdjudicationInput {
  ledger: RefLedger;
  repo: string;
  ref: string;
  from: string | null;
  to: string | null;
  objectCids: string[];
  actor: string;
  node: string;
  timestamp?: string;
  nonce: string;
  capability?: CasterCapability;
  actorSignature?: string;
  actorPrivateKeyPem?: string;
  actorPublicKeyPem?: string;
  nodePrivateKeyPem?: string;
  nodeSignature?: string;
  nodePublicKeyPem?: string;
  nonceStore?: NonceStore;
  policy?: RefPolicy;
  explicitProtectedOverride?: boolean;
  now?: Date;
}

export interface RefAdjudicationResult {
  ok: boolean;
  status: "alpha-local" | "blocked" | "error";
  errors: string[];
  certificate?: RefUpdateCertificate;
  ledger?: RefLedger;
  conflictEvidence?: RefConflictEvidence;
  doubleSignEvidence?: DoubleSignEvidence;
}

export async function adjudicateRefUpdate(args: RefAdjudicationInput): Promise<RefAdjudicationResult> {
  const errors: string[] = [];
  if (!args.repo.startsWith("gitcaster://did:caster:")) errors.push("repo id invalid");
  if (!args.actor.startsWith("did:caster:")) errors.push("actor DID invalid");
  if (!args.node.startsWith("did:caster:")) errors.push("node DID invalid");
  if (!args.capability) errors.push("capability missing");
  if (args.capability && !["ref:update", "repo:write", "repo:admin"].includes(args.capability.scope)) errors.push("capability scope not allowed");
  if (args.capability && args.actorPublicKeyPem) {
    const capabilityResult = verifyCapability({ capability: args.capability, publicKeyPem: args.actorPublicKeyPem, expectedResourcePrefix: "gitcaster://" });
    if (!capabilityResult.ok) errors.push(...capabilityResult.errors);
  }
  if (args.nonceStore) {
    const nonce = assertFreshNonce(args.nonceStore, args.nonce);
    if (!nonce.ok) errors.push(nonce.error || "nonce replay");
  }
  const timestamp = checkTimestampSkew(args.timestamp || new Date().toISOString(), 300, args.now || new Date());
  if (!timestamp.ok) errors.push(timestamp.error || "timestamp skew");
  const currentHead = getCurrentHead(args.ledger, args.repo, args.ref);
  const policyResult = validateRefUpdatePolicy({
    ref: args.ref,
    from: args.from,
    to: args.to,
    currentHead,
    scope: args.capability?.scope,
    policy: args.policy || DEFAULT_REF_POLICY,
    explicitProtectedOverride: args.explicitProtectedOverride,
  });
  errors.push(...policyResult.errors);
  if (args.to === null) errors.push("branch deletion disabled in PR-07");
  const conflict = detectRefConflict({ expectedFrom: currentHead, attemptedFrom: args.from, attemptedTo: args.to });
  const conflictEvidence = conflict
    ? createRefConflictEvidence({ repo: args.repo, ref: args.ref, expectedFrom: currentHead, attemptedFrom: args.from, attemptedTo: args.to, actor: args.actor })
    : undefined;
  if (conflictEvidence) errors.push("conflicting ref update");
  if (errors.length) return { ok: false, status: "blocked", errors, conflictEvidence };
  const issued = await issueRefUpdateCertificate({
    repo: args.repo,
    ref: args.ref,
    from: args.from,
    to: args.to || "",
    objectCids: args.objectCids,
    actor: args.actor,
    node: args.node,
    timestamp: args.timestamp,
    nonce: args.nonce,
    capability: args.capability,
    actorSignature: args.actorSignature,
    actorPrivateKeyPem: args.actorPrivateKeyPem,
    actorPublicKeyPem: args.actorPublicKeyPem,
    nodePrivateKeyPem: args.nodePrivateKeyPem,
    nodeSignature: args.nodeSignature,
  });
  if (!issued.ok || !issued.certificate) return { ok: false, status: "blocked", errors: issued.errors, conflictEvidence };
  const existing = listRefCertificates(args.ledger, args.repo, args.ref);
  const doubleSign = detectDoubleSign({ existing, candidate: issued.certificate });
  const doubleSignEvidence = doubleSign
    ? createDoubleSignEvidence({ repo: args.repo, ref: args.ref, node: args.node, height: ledgerHeight(args.ledger, args.repo, args.ref) + 1, certificateA: existing[existing.length - 1], certificateB: issued.certificate })
    : undefined;
  if (doubleSignEvidence) return { ok: false, status: "blocked", errors: ["double-sign detected"], doubleSignEvidence };
  try {
    const ledger = appendRefCertificate(args.ledger, issued.certificate);
    return { ok: true, status: "alpha-local", errors: [], certificate: issued.certificate, ledger };
  } catch (error) {
    return { ok: false, status: "blocked", errors: [(error as Error).message], conflictEvidence };
  }
}
