import type { GitCasterEvent, GitCasterPR } from "../../protocol/dist/types.js";
import { eventIdFor } from "./event-log.js";

export interface PullRequestReviewPayload {
  type: "gitcaster.pr.review.payload.v1";
  repo: string;
  prId: string;
  status: "approved" | "changes-requested" | "commented";
  body?: string;
}

export interface GitCasterPRReview {
  type: "gitcaster.pr.review.v1";
  id: string;
  repo: string;
  prId: string;
  reviewer: string;
  status: "approved" | "changes-requested" | "commented";
  body: string;
  signature: string | null;
  createdAt: string;
  statusLabel: "alpha-local";
}

function assertCasterActor(actor: string): void {
  if (!actor.startsWith("did:caster:")) throw new Error("reviewer must be did:caster");
}

export function createGitCasterPRReview(args: {
  id: string;
  repo: string;
  payload: PullRequestReviewPayload;
  reviewer: string;
  signature?: string | null;
  createdAt?: string;
}): GitCasterPRReview {
  assertCasterActor(args.reviewer);
  if (args.payload.repo !== args.repo) throw new Error("review repo mismatch");
  if (!["approved", "changes-requested", "commented"].includes(args.payload.status)) throw new Error("review status invalid");
  if ((args.payload.body || "").length > 20_000) throw new Error("review body max length is 20000");
  return {
    type: "gitcaster.pr.review.v1",
    id: args.id,
    repo: args.repo,
    prId: args.payload.prId,
    reviewer: args.reviewer,
    status: args.payload.status,
    body: args.payload.body || "",
    signature: args.signature || null,
    createdAt: args.createdAt || new Date().toISOString(),
    statusLabel: "alpha-local",
  };
}

export function applyReviewToPR(args: { pr: GitCasterPR; review: GitCasterPRReview; updatedAt?: string }): GitCasterPR {
  return {
    ...args.pr,
    status: args.review.status === "commented" ? args.pr.status : "reviewed",
    reviewers: Array.from(new Set([...args.pr.reviewers, args.review.reviewer])),
    updatedAt: args.updatedAt || args.review.createdAt,
  };
}

export function createPRReviewedEvent(args: { actor: string; pr: GitCasterPR; review: GitCasterPRReview; signature?: string | null; timestamp?: string }): GitCasterEvent {
  const timestamp = args.timestamp || new Date().toISOString();
  return {
    type: "gitcaster.pr.reviewed.v1",
    id: eventIdFor({ type: "gitcaster.pr.reviewed.v1", actor: args.actor, repo: args.pr.repo, prId: args.pr.id, reviewId: args.review.id, timestamp }),
    actor: args.actor,
    repo: args.pr.repo,
    payload: { prId: args.pr.id, reviewId: args.review.id, reviewStatus: args.review.status },
    timestamp,
    signature: args.signature || null,
    status: "alpha-local",
  };
}
