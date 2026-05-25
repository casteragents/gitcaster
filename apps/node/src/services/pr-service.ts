import type { GitCasterPR, SignatureRecord, SignedMutationEnvelope } from "../../../../packages/protocol/dist/types.js";
import {
  applyReviewToPR,
  createGitCasterPR,
  createGitCasterPRReview,
  createPRMergedEvent,
  createPROpenedEvent,
  createPRReviewedEvent,
  mergeGitCasterPR,
  type GitCasterPRReview,
  type PullRequestCreatePayload,
  type PullRequestMergePayload,
  type PullRequestReviewPayload,
} from "../../../../packages/repo-records/dist/index.js";
import type { NodeMutationVerificationResult } from "./mutation-verify.js";
import {
  createPRInStore,
  createReviewInStore,
  getPRById,
  getRepoByOwnerAndName,
  listPRsForRepo,
  listReviewsForPR,
  nextPRId,
  nextReviewId,
  updatePRInStore,
  type LocalAlphaStore,
} from "./local-alpha-store.js";

export interface PrServiceResult {
  statusCode: number;
  body: unknown;
}

function errorResult(statusCode: number, error: string, reason: string): PrServiceResult {
  return { statusCode, body: { type: "gitcaster.pr.error.v1", status: "error", error, reason } };
}

function signatureFromEnvelope(envelope: SignedMutationEnvelope): SignatureRecord {
  return {
    signer: envelope.actor,
    alg: "ed25519",
    sig: envelope.signature || "[missing-signature]",
    signedAt: envelope.timestamp,
  };
}

function assertVerified(verification: NodeMutationVerificationResult, scope: "pr:write" | "pr:merge"): PrServiceResult | null {
  if (!verification.ok || verification.scope !== scope || !verification.envelope) {
    return errorResult(403, "verification_failed", `Signed ${scope} mutation verification is required.`);
  }
  return null;
}

function repoOrError(store: LocalAlphaStore, owner: string, repoName: string): { repoId: string } | PrServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) return errorResult(404, "repo_not_found", "Repo must exist before PR records can be created.");
  return { repoId: repo.id };
}

function isErrorResult(value: { repoId: string } | PrServiceResult): value is PrServiceResult {
  return typeof (value as { statusCode?: unknown }).statusCode === "number";
}

function prCreatePayload(payload: Record<string, unknown>): PullRequestCreatePayload | null {
  if (payload.type !== "gitcaster.pr.create.payload.v1") return null;
  if (typeof payload.repo !== "string" || typeof payload.head !== "string" || typeof payload.base !== "string" || typeof payload.title !== "string") return null;
  return {
    type: "gitcaster.pr.create.payload.v1",
    repo: payload.repo,
    head: payload.head,
    base: payload.base,
    title: payload.title,
    body: typeof payload.body === "string" ? payload.body : "",
    diffCid: typeof payload.diffCid === "string" ? payload.diffCid : null,
  };
}

function reviewPayload(payload: Record<string, unknown>): PullRequestReviewPayload | null {
  if (payload.type !== "gitcaster.pr.review.payload.v1") return null;
  if (typeof payload.repo !== "string" || typeof payload.prId !== "string") return null;
  if (payload.status !== "approved" && payload.status !== "changes-requested" && payload.status !== "commented") return null;
  return {
    type: "gitcaster.pr.review.payload.v1",
    repo: payload.repo,
    prId: payload.prId,
    status: payload.status,
    body: typeof payload.body === "string" ? payload.body : "",
  };
}

function mergePayload(payload: Record<string, unknown>): PullRequestMergePayload | null {
  if (payload.type !== "gitcaster.pr.merge.payload.v1") return null;
  if (typeof payload.repo !== "string" || typeof payload.prId !== "string") return null;
  if (payload.strategy !== "record-only" && payload.strategy !== "fast-forward") return null;
  return { type: "gitcaster.pr.merge.payload.v1", repo: payload.repo, prId: payload.prId, strategy: payload.strategy };
}

export function handleCreatePR(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult, owner: string, repoName: string): PrServiceResult {
  const verified = assertVerified(verification, "pr:write");
  if (verified) return verified;
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const payload = prCreatePayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "PR create payload is invalid.");
  if (payload.repo !== repoLookup.repoId) return errorResult(400, "repo_mismatch", "PR payload repo must match route repo.");
  let pr: GitCasterPR;
  try {
    pr = createGitCasterPR({
      id: nextPRId(store, repoLookup.repoId),
      repo: repoLookup.repoId,
      payload,
      author: envelope.actor,
      signature: signatureFromEnvelope(envelope),
      createdAt: envelope.timestamp,
    });
  } catch (error) {
    return errorResult(400, "invalid_pr", (error as Error).message);
  }
  const event = createPROpenedEvent({ actor: envelope.actor, pr, signature: envelope.signature, timestamp: envelope.timestamp });
  pr.events = [event];
  createPRInStore(store, repoLookup.repoId, pr, event);
  return { statusCode: 201, body: { type: "gitcaster.pr.create.result.v1", status: "alpha-local", pr, events: [event], publicNetworkClaimed: false, fakeDiffClaimed: false } };
}

export function handleListPRs(store: LocalAlphaStore, owner: string, repoName: string): PrServiceResult {
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const prs = listPRsForRepo(store, repoLookup.repoId);
  return { statusCode: 200, body: { type: "gitcaster.pr.list.v1", status: "alpha-local", repo: repoLookup.repoId, count: prs.length, prs } };
}

export function handleViewPR(store: LocalAlphaStore, owner: string, repoName: string, prId: string): PrServiceResult {
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const pr = getPRById(store, repoLookup.repoId, prId);
  if (!pr) return errorResult(404, "pr_not_found", "PR does not exist.");
  return { statusCode: 200, body: { type: "gitcaster.pr.view.v1", status: "alpha-local", pr, reviews: listReviewsForPR(store, repoLookup.repoId, prId) } };
}

export function handleReviewPR(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult, owner: string, repoName: string, prId: string): PrServiceResult {
  const verified = assertVerified(verification, "pr:write");
  if (verified) return verified;
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const existing = getPRById(store, repoLookup.repoId, prId);
  if (!existing) return errorResult(404, "pr_not_found", "PR does not exist.");
  const payload = reviewPayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "PR review payload is invalid.");
  if (payload.repo !== repoLookup.repoId || payload.prId !== prId) return errorResult(400, "pr_mismatch", "PR review payload must match route.");
  let review: GitCasterPRReview;
  let pr: GitCasterPR;
  try {
    review = createGitCasterPRReview({
      id: nextReviewId(store, repoLookup.repoId, prId),
      repo: repoLookup.repoId,
      payload,
      reviewer: envelope.actor,
      signature: envelope.signature,
      createdAt: envelope.timestamp,
    });
    pr = applyReviewToPR({ pr: existing, review, updatedAt: envelope.timestamp });
  } catch (error) {
    return errorResult(400, "invalid_review", (error as Error).message);
  }
  const event = createPRReviewedEvent({ actor: envelope.actor, pr, review, signature: envelope.signature, timestamp: envelope.timestamp });
  pr.events = [...existing.events, event];
  updatePRInStore(store, repoLookup.repoId, pr, event);
  createReviewInStore(store, repoLookup.repoId, prId, review, event);
  return { statusCode: 201, body: { type: "gitcaster.pr.review.result.v1", status: "alpha-local", pr, review, events: [event], publicNetworkClaimed: false } };
}

export function handleMergePR(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult, owner: string, repoName: string, prId: string): PrServiceResult {
  const verified = assertVerified(verification, "pr:merge");
  if (verified) return verified;
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const existing = getPRById(store, repoLookup.repoId, prId);
  if (!existing) return errorResult(404, "pr_not_found", "PR does not exist.");
  const payload = mergePayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "PR merge payload is invalid.");
  if (payload.repo !== repoLookup.repoId || payload.prId !== prId) return errorResult(400, "pr_mismatch", "PR merge payload must match route.");
  if (payload.strategy === "fast-forward") {
    return {
      statusCode: 409,
      body: {
        type: "gitcaster.pr.merge.blocked.v1",
        status: "blocked",
        reason: "Fast-forward merge requires ref update proof and compatible head/base objects.",
        refsChanged: false,
        publicNetworkClaimed: false,
      },
    };
  }
  let pr: GitCasterPR;
  try {
    pr = mergeGitCasterPR({ pr: existing, payload, actor: envelope.actor, signature: signatureFromEnvelope(envelope), mergedAt: envelope.timestamp });
  } catch (error) {
    return errorResult(400, "invalid_merge", (error as Error).message);
  }
  const event = createPRMergedEvent({ actor: envelope.actor, pr, signature: envelope.signature, timestamp: envelope.timestamp, refsChanged: false });
  pr.events = [...existing.events, event];
  updatePRInStore(store, repoLookup.repoId, pr, event);
  return {
    statusCode: 200,
    body: {
      type: "gitcaster.pr.merge.result.v1",
      status: "alpha-local",
      repo: repoLookup.repoId,
      prId,
      mergeMode: "record-only",
      refsChanged: false,
      pr,
      events: [event],
      notice: "Local alpha record-only merge. No public network ref update claimed.",
    },
  };
}
