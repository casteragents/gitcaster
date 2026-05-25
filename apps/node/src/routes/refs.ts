import type { RouteRegistry } from "../services/route-registry.js";
import { adjudicateRefUpdate } from "../../../../packages/ref-consensus/dist/index.js";
import {
  appendEvent,
  appendRefCertificateToStore,
  getRefLedger,
  getRepo,
  listRepoRefs,
  recordDoubleSignEvidence,
  recordRefConflictEvidence,
} from "../services/local-alpha-store.js";

function missingRepo(owner: string, repo: string) {
  return {
    type: "gitcaster.repo.lookup.v1",
    status: "blocked",
    reason: "Repo records are implemented in PR-05.",
    owner,
    repo,
  };
}

function normalizeRefPayload(payload: Record<string, unknown>) {
  if (payload.type !== "gitcaster.ref.update.payload.v1") return null;
  if (typeof payload.ref !== "string") return null;
  if (typeof payload.to !== "string" && payload.to !== null) return null;
  if (typeof payload.from !== "string" && payload.from !== null) return null;
  if (!Array.isArray(payload.objectCids) || !payload.objectCids.every((item) => typeof item === "string")) return null;
  return {
    ref: payload.ref,
    from: payload.from,
    to: payload.to,
    objectCids: payload.objectCids as string[],
    actorSignature: typeof payload.actorSignature === "string" ? payload.actorSignature : undefined,
  };
}

export function registerRefRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/repos/:owner/:repo/refs", ({ params, store }) => {
    const repo = getRepo(store, params.owner, params.repo);
    if (!repo) return { statusCode: 404, body: missingRepo(params.owner, params.repo) };
    const refs = listRepoRefs(store, repo.id);
    return {
      statusCode: 200,
      body: {
        type: "gitcaster.repo.refs.v1",
        status: "alpha-local",
        repo: repo.id,
        refs,
        ledgers: Object.fromEntries(refs.map((ref) => [ref.name, getRefLedger(store, repo.id, ref.name).entries])),
      },
    };
  });

  registry.add("POST", "/repos/:owner/:repo/refs/update", async ({ params, store, config, verifiedMutation }) => {
    const repo = getRepo(store, params.owner, params.repo);
    if (!repo) return { statusCode: 404, body: missingRepo(params.owner, params.repo) };
    if (!verifiedMutation?.envelope || !verifiedMutation.ok) {
      return { statusCode: 403, body: { type: "gitcaster.ref.update.error.v1", status: "blocked", error: "signed ref mutation verification is required" } };
    }
    const payload = normalizeRefPayload(verifiedMutation.envelope.payload);
    if (!payload) {
      return { statusCode: 400, body: { type: "gitcaster.ref.update.error.v1", status: "error", error: "invalid_ref_update_payload" } };
    }
    const actorRecord = store.identities.get(verifiedMutation.envelope.actor);
    const ledger = getRefLedger(store, repo.id, payload.ref);
    const exactRefResource = verifiedMutation.envelope.capability?.resource === `${repo.id}#${payload.ref}`;
    const result = await adjudicateRefUpdate({
      ledger,
      repo: repo.id,
      ref: payload.ref,
      from: payload.from,
      to: payload.to,
      objectCids: payload.objectCids,
      actor: verifiedMutation.envelope.actor,
      node: config.nodeDid,
      timestamp: verifiedMutation.envelope.timestamp,
      nonce: `cert-${verifiedMutation.envelope.nonce}`,
      capability: verifiedMutation.envelope.capability,
      actorSignature: payload.actorSignature,
      actorPublicKeyPem: actorRecord?.publicKeyPem,
      nodePrivateKeyPem: store.nodeKeys.privateKeyPem,
      explicitProtectedOverride: exactRefResource,
    });
    if (!result.ok || !result.certificate) {
      if (result.conflictEvidence) {
        recordRefConflictEvidence(store, result.conflictEvidence);
        appendEvent(store, {
          type: "gitcaster.ref.updated.v1",
          id: `event-ref-conflict-${Date.now()}`,
          actor: verifiedMutation.envelope.actor,
          repo: repo.id,
          payload: result.conflictEvidence as unknown as Record<string, unknown>,
          timestamp: new Date().toISOString(),
          signature: null,
          status: "blocked",
        });
      }
      if (result.doubleSignEvidence) recordDoubleSignEvidence(store, result.doubleSignEvidence);
      return {
        statusCode: 409,
        body: {
          type: "gitcaster.ref.update.result.v1",
          status: "blocked",
          errors: result.errors,
          conflictEvidence: result.conflictEvidence,
          doubleSignEvidence: result.doubleSignEvidence,
        },
      };
    }
    const nextLedger = appendRefCertificateToStore(store, repo.id, payload.ref, result.certificate);
    appendEvent(store, {
      type: "gitcaster.ref.certificate.issued.v1",
      id: `event-ref-cert-${Date.now()}`,
      actor: verifiedMutation.envelope.actor,
      repo: repo.id,
      payload: { certificate: result.certificate, ledgerHeight: nextLedger.entries.length },
      timestamp: result.certificate.timestamp,
      signature: result.certificate.signatures[0]?.sig || null,
      status: "alpha-local",
    });
    store.writesAccepted += 1;
    return {
      statusCode: 200,
      body: {
        type: "gitcaster.ref.update.result.v1",
        status: "alpha-local",
        certificate: result.certificate,
        ledger: nextLedger,
        publicConsensusClaimed: false,
        productionConsensusClaimed: false,
      },
    };
  });
}
