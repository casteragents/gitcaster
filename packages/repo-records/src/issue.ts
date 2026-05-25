import type { GitCasterEvent, GitCasterIssue, SignatureRecord } from "../../protocol/dist/types.js";
import { eventIdFor } from "./event-log.js";

export interface IssueTitleValidationResult {
  ok: boolean;
  errors: string[];
}

export interface IssueCreatePayload {
  type: "gitcaster.issue.create.payload.v1";
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
}

export interface IssueUpdatePayload {
  type: "gitcaster.issue.update.payload.v1";
  repo: string;
  issueId: string;
  status?: "open" | "closed";
  body?: string;
}

function assertCasterRepo(repo: string): void {
  if (!repo.startsWith("gitcaster://did:caster:")) throw new Error("repo must be gitcaster://did:caster");
}

function assertCasterActor(actor: string): void {
  if (!actor.startsWith("did:caster:")) throw new Error("actor must be did:caster");
}

function sanitizeLabels(labels: string[] = []): string[] {
  return labels.map((label) => label.trim()).filter(Boolean).map((label) => {
    if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(label)) throw new Error("issue label is not slug-safe");
    return label;
  });
}

export function validateIssueTitle(title: string): IssueTitleValidationResult {
  const errors: string[] = [];
  if (!title || !title.trim()) errors.push("title is required");
  if (title.length > 160) errors.push("title max length is 160");
  return { ok: errors.length === 0, errors };
}

export function createGitCasterIssue(args: {
  id: string;
  repo: string;
  payload: IssueCreatePayload;
  author: string;
  signature?: SignatureRecord | null;
  createdAt?: string;
}): GitCasterIssue {
  assertCasterRepo(args.repo);
  assertCasterActor(args.author);
  const title = validateIssueTitle(args.payload.title);
  if (!title.ok) throw new Error(title.errors.join("; "));
  if ((args.payload.body || "").length > 20_000) throw new Error("issue body max length is 20000");
  const createdAt = args.createdAt || new Date().toISOString();
  return {
    type: "gitcaster.issue.v1",
    id: args.id,
    repo: args.repo,
    title: args.payload.title.trim(),
    body: args.payload.body || "",
    author: args.author,
    status: "open",
    labels: sanitizeLabels(args.payload.labels),
    events: [],
    signatures: args.signature ? [args.signature] : [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function updateGitCasterIssue(args: {
  issue: GitCasterIssue;
  payload: IssueUpdatePayload;
  signature?: SignatureRecord | null;
  updatedAt?: string;
}): GitCasterIssue {
  assertCasterRepo(args.issue.repo);
  if (args.payload.repo !== args.issue.repo) throw new Error("issue update repo mismatch");
  if (args.payload.issueId !== args.issue.id) throw new Error("issue update id mismatch");
  if (args.payload.status && !["open", "closed"].includes(args.payload.status)) throw new Error("issue status invalid");
  if (typeof args.payload.body === "string" && args.payload.body.length > 20_000) throw new Error("issue body max length is 20000");
  return {
    ...args.issue,
    status: args.payload.status || args.issue.status,
    body: typeof args.payload.body === "string" ? args.payload.body : args.issue.body,
    signatures: args.signature ? [...args.issue.signatures, args.signature] : [...args.issue.signatures],
    updatedAt: args.updatedAt || new Date().toISOString(),
  };
}

export function createIssueOpenedEvent(args: { actor: string; issue: GitCasterIssue; signature?: string | null; timestamp?: string }): GitCasterEvent {
  const timestamp = args.timestamp || new Date().toISOString();
  return {
    type: "gitcaster.issue.opened.v1",
    id: eventIdFor({ type: "gitcaster.issue.opened.v1", actor: args.actor, repo: args.issue.repo, issueId: args.issue.id, timestamp }),
    actor: args.actor,
    repo: args.issue.repo,
    payload: { issueId: args.issue.id, title: args.issue.title, labels: args.issue.labels, status: args.issue.status },
    timestamp,
    signature: args.signature || null,
    status: "alpha-local",
  };
}

export function createIssueUpdatedEvent(args: { actor: string; issue: GitCasterIssue; signature?: string | null; timestamp?: string }): GitCasterEvent {
  const timestamp = args.timestamp || new Date().toISOString();
  return {
    type: "gitcaster.issue.updated.v1",
    id: eventIdFor({ type: "gitcaster.issue.updated.v1", actor: args.actor, repo: args.issue.repo, issueId: args.issue.id, status: args.issue.status, timestamp }),
    actor: args.actor,
    repo: args.issue.repo,
    payload: { issueId: args.issue.id, status: args.issue.status },
    timestamp,
    signature: args.signature || null,
    status: "alpha-local",
  };
}
