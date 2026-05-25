import type { GitCasterEvent, GitCasterPR, SignatureRecord } from "../../protocol/dist/types.js";
import { eventIdFor } from "./event-log.js";

export interface BranchValidationResult {
  ok: boolean;
  errors: string[];
}

export interface PullRequestCreatePayload {
  type: "gitcaster.pr.create.payload.v1";
  repo: string;
  head: string;
  base: string;
  title: string;
  body?: string;
  diffCid?: string | null;
}

export interface PullRequestMergePayload {
  type: "gitcaster.pr.merge.payload.v1";
  repo: string;
  prId: string;
  strategy: "record-only" | "fast-forward";
}

function assertCasterRepo(repo: string): void {
  if (!repo.startsWith("gitcaster://did:caster:")) throw new Error("repo must be gitcaster://did:caster");
}

function assertCasterActor(actor: string): void {
  if (!actor.startsWith("did:caster:")) throw new Error("actor must be did:caster");
}

function assertTitle(title: string): void {
  if (!title || !title.trim()) throw new Error("title is required");
  if (title.length > 160) throw new Error("title max length is 160");
}

export function validateBranchName(branch: string): BranchValidationResult {
  const errors: string[] = [];
  if (!branch || !branch.trim()) errors.push("branch is required");
  if (!/^[A-Za-z0-9._/-]{1,120}$/.test(branch)) errors.push("branch contains invalid characters");
  if (branch.includes("..") || branch.startsWith("/") || branch.endsWith("/") || branch.includes("\\")) errors.push("branch has unsafe path shape");
  return { ok: errors.length === 0, errors };
}

export function createGitCasterPR(args: {
  id: string;
  repo: string;
  payload: PullRequestCreatePayload;
  author: string;
  signature?: SignatureRecord | null;
  createdAt?: string;
}): GitCasterPR {
  assertCasterRepo(args.repo);
  assertCasterActor(args.author);
  assertTitle(args.payload.title);
  if ((args.payload.body || "").length > 20_000) throw new Error("PR body max length is 20000");
  const head = validateBranchName(args.payload.head);
  const base = validateBranchName(args.payload.base);
  if (!head.ok) throw new Error(head.errors.join("; "));
  if (!base.ok) throw new Error(base.errors.join("; "));
  const createdAt = args.createdAt || new Date().toISOString();
  return {
    type: "gitcaster.pr.v1",
    id: args.id,
    repo: args.repo,
    title: args.payload.title.trim(),
    body: args.payload.body || "",
    base: args.payload.base,
    head: args.payload.head,
    author: args.author,
    reviewers: [],
    status: "open",
    diffCid: args.payload.diffCid || null,
    events: [],
    signatures: args.signature ? [args.signature] : [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function mergeGitCasterPR(args: {
  pr: GitCasterPR;
  payload: PullRequestMergePayload;
  actor: string;
  signature?: SignatureRecord | null;
  mergedAt?: string;
}): GitCasterPR {
  assertCasterActor(args.actor);
  if (args.payload.repo !== args.pr.repo) throw new Error("PR merge repo mismatch");
  if (args.payload.prId !== args.pr.id) throw new Error("PR merge id mismatch");
  if (args.payload.strategy !== "record-only") throw new Error("fast-forward merge requires ref update proof");
  const mergedAt = args.mergedAt || new Date().toISOString();
  return {
    ...args.pr,
    status: "merged",
    signatures: args.signature ? [...args.pr.signatures, args.signature] : [...args.pr.signatures],
    updatedAt: mergedAt,
  };
}

export function createPROpenedEvent(args: { actor: string; pr: GitCasterPR; signature?: string | null; timestamp?: string }): GitCasterEvent {
  const timestamp = args.timestamp || new Date().toISOString();
  return {
    type: "gitcaster.pr.opened.v1",
    id: eventIdFor({ type: "gitcaster.pr.opened.v1", actor: args.actor, repo: args.pr.repo, prId: args.pr.id, timestamp }),
    actor: args.actor,
    repo: args.pr.repo,
    payload: { prId: args.pr.id, title: args.pr.title, base: args.pr.base, head: args.pr.head, diffCid: args.pr.diffCid || null },
    timestamp,
    signature: args.signature || null,
    status: "alpha-local",
  };
}

export function createPRMergedEvent(args: { actor: string; pr: GitCasterPR; signature?: string | null; timestamp?: string; refsChanged?: boolean }): GitCasterEvent {
  const timestamp = args.timestamp || new Date().toISOString();
  return {
    type: "gitcaster.pr.merged.v1",
    id: eventIdFor({ type: "gitcaster.pr.merged.v1", actor: args.actor, repo: args.pr.repo, prId: args.pr.id, timestamp }),
    actor: args.actor,
    repo: args.pr.repo,
    payload: { prId: args.pr.id, mergeMode: "record-only", refsChanged: Boolean(args.refsChanged) },
    timestamp,
    signature: args.signature || null,
    status: "alpha-local",
  };
}
