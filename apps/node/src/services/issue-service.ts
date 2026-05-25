import type { GitCasterIssue, SignatureRecord, SignedMutationEnvelope } from "../../../../packages/protocol/dist/types.js";
import {
  createGitCasterIssue,
  createIssueOpenedEvent,
  createIssueUpdatedEvent,
  updateGitCasterIssue,
  type IssueCreatePayload,
  type IssueUpdatePayload,
} from "../../../../packages/repo-records/dist/index.js";
import type { NodeMutationVerificationResult } from "./mutation-verify.js";
import {
  createIssueInStore,
  getIssueById,
  getRepoByOwnerAndName,
  listIssuesForRepo,
  nextIssueId,
  updateIssueInStore,
  type LocalAlphaStore,
} from "./local-alpha-store.js";

export interface IssueServiceResult {
  statusCode: number;
  body: unknown;
}

function errorResult(statusCode: number, error: string, reason: string): IssueServiceResult {
  return {
    statusCode,
    body: { type: "gitcaster.issue.error.v1", status: "error", error, reason },
  };
}

function signatureFromEnvelope(envelope: SignedMutationEnvelope): SignatureRecord {
  return {
    signer: envelope.actor,
    alg: "ed25519",
    sig: envelope.signature || "[missing-signature]",
    signedAt: envelope.timestamp,
  };
}

function assertVerified(verification: NodeMutationVerificationResult, scope: "issue:write"): IssueServiceResult | null {
  if (!verification.ok || verification.scope !== scope || !verification.envelope) {
    return errorResult(403, "verification_failed", `Signed ${scope} mutation verification is required.`);
  }
  return null;
}

function issueCreatePayload(payload: Record<string, unknown>): IssueCreatePayload | null {
  if (payload.type !== "gitcaster.issue.create.payload.v1") return null;
  if (typeof payload.repo !== "string" || typeof payload.title !== "string") return null;
  return {
    type: "gitcaster.issue.create.payload.v1",
    repo: payload.repo,
    title: payload.title,
    body: typeof payload.body === "string" ? payload.body : "",
    labels: Array.isArray(payload.labels) ? payload.labels.filter((label): label is string => typeof label === "string") : [],
  };
}

function issueUpdatePayload(payload: Record<string, unknown>): IssueUpdatePayload | null {
  if (payload.type !== "gitcaster.issue.update.payload.v1") return null;
  if (typeof payload.repo !== "string" || typeof payload.issueId !== "string") return null;
  return {
    type: "gitcaster.issue.update.payload.v1",
    repo: payload.repo,
    issueId: payload.issueId,
    status: payload.status === "open" || payload.status === "closed" ? payload.status : undefined,
    body: typeof payload.body === "string" ? payload.body : undefined,
  };
}

function repoOrError(store: LocalAlphaStore, owner: string, repoName: string): { repoId: string } | IssueServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) return errorResult(404, "repo_not_found", "Repo must exist before issues can be created.");
  return { repoId: repo.id };
}

function isErrorResult(value: { repoId: string } | IssueServiceResult): value is IssueServiceResult {
  return typeof (value as { statusCode?: unknown }).statusCode === "number";
}

export function handleCreateIssue(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult, owner: string, repoName: string): IssueServiceResult {
  const verified = assertVerified(verification, "issue:write");
  if (verified) return verified;
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const payload = issueCreatePayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "Issue create payload is invalid.");
  if (payload.repo !== repoLookup.repoId) return errorResult(400, "repo_mismatch", "Issue payload repo must match route repo.");
  let issue: GitCasterIssue;
  try {
    issue = createGitCasterIssue({
      id: nextIssueId(store, repoLookup.repoId),
      repo: repoLookup.repoId,
      payload,
      author: envelope.actor,
      signature: signatureFromEnvelope(envelope),
      createdAt: envelope.timestamp,
    });
  } catch (error) {
    return errorResult(400, "invalid_issue", (error as Error).message);
  }
  const event = createIssueOpenedEvent({ actor: envelope.actor, issue, signature: envelope.signature, timestamp: envelope.timestamp });
  issue.events = [event];
  createIssueInStore(store, repoLookup.repoId, issue, event);
  return { statusCode: 201, body: { type: "gitcaster.issue.create.result.v1", status: "alpha-local", issue, events: [event], publicNetworkClaimed: false } };
}

export function handleListIssues(store: LocalAlphaStore, owner: string, repoName: string): IssueServiceResult {
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const issues = listIssuesForRepo(store, repoLookup.repoId);
  return { statusCode: 200, body: { type: "gitcaster.issue.list.v1", status: "alpha-local", repo: repoLookup.repoId, count: issues.length, issues } };
}

export function handleUpdateIssue(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult, owner: string, repoName: string, issueId: string): IssueServiceResult {
  const verified = assertVerified(verification, "issue:write");
  if (verified) return verified;
  const repoLookup = repoOrError(store, owner, repoName);
  if (isErrorResult(repoLookup)) return repoLookup;
  const existing = getIssueById(store, repoLookup.repoId, issueId);
  if (!existing) return errorResult(404, "issue_not_found", "Issue does not exist.");
  const payload = issueUpdatePayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "Issue update payload is invalid.");
  if (payload.repo !== repoLookup.repoId || payload.issueId !== issueId) return errorResult(400, "issue_mismatch", "Issue update payload must match route.");
  let issue: GitCasterIssue;
  try {
    issue = updateGitCasterIssue({ issue: existing, payload, signature: signatureFromEnvelope(envelope), updatedAt: envelope.timestamp });
  } catch (error) {
    return errorResult(400, "invalid_issue_update", (error as Error).message);
  }
  const event = createIssueUpdatedEvent({ actor: envelope.actor, issue, signature: envelope.signature, timestamp: envelope.timestamp });
  issue.events = [...existing.events, event];
  updateIssueInStore(store, repoLookup.repoId, issue, event);
  return { statusCode: 200, body: { type: "gitcaster.issue.update.result.v1", status: "alpha-local", issue, events: [event], publicNetworkClaimed: false } };
}
