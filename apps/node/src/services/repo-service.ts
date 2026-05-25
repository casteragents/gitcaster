import { createHash } from "node:crypto";
import type { GitCasterEvent, GitCasterRepo, SignedMutationEnvelope } from "../../../../packages/protocol/dist/types.js";
import { createCasterCloudBlockerProof, createQStorageBlockerProof } from "../../../../packages/object-store/dist/index.js";
import {
  createGitCasterRepo,
  createRepoCreatedEvent,
  type RepoCreatePayload,
  validateRepoName,
} from "../../../../packages/repo-records/dist/index.js";
import type { NodeMutationVerificationResult } from "./mutation-verify.js";
import {
  createRepoInStore,
  getRepoByOwnerAndName,
  getRefLedger,
  getRepoTree,
  getRepoProofPlaceholders,
  listRepoEvents,
  listRepoRefs,
  listRepos,
  repoExistsForOwner,
  type LocalAlphaStore,
} from "./local-alpha-store.js";

export interface RepoServiceResult {
  statusCode: number;
  body: unknown;
}

function hashRepoManifest(repo: GitCasterRepo): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(repo)).digest("hex")}`;
}

function errorResult(statusCode: number, error: string, reason: string): RepoServiceResult {
  return {
    statusCode,
    body: {
      type: "gitcaster.repo.create.error.v1",
      status: "error",
      error,
      reason,
    },
  };
}

function normalizePayload(payload: Record<string, unknown>): RepoCreatePayload | null {
  if (payload.type !== "gitcaster.repo.create.payload.v1") return null;
  if (typeof payload.name !== "string") return null;
  return {
    type: "gitcaster.repo.create.payload.v1",
    name: payload.name,
    description: typeof payload.description === "string" ? payload.description : "",
    visibility: payload.visibility === "private" || payload.visibility === "unlisted" ? payload.visibility : "public",
    defaultBranch: typeof payload.defaultBranch === "string" ? payload.defaultBranch : "main",
  };
}

export function handleCreateRepo(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult): RepoServiceResult {
  if (!verification.ok || verification.scope !== "repo:create") return errorResult(403, "verification_failed", "Signed repo:create mutation verification is required.");
  const payload = normalizePayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "Repo create payload type, name, visibility, or default branch is invalid.");
  const nameValidation = validateRepoName(payload.name);
  if (!nameValidation.ok) return errorResult(400, "invalid_repo_name", nameValidation.errors.join("; "));
  if (!["public", "private", "unlisted"].includes(payload.visibility || "public")) return errorResult(400, "invalid_visibility", "Repo visibility must be public, private, or unlisted.");
  if (repoExistsForOwner(store, envelope.actor, payload.name)) return errorResult(409, "repo_exists", "Repo already exists for this owner.");
  let repo: GitCasterRepo;
  try {
    repo = createGitCasterRepo({ ownerDid: envelope.actor, payload, createdAt: envelope.timestamp });
  } catch (error) {
    return errorResult(400, "invalid_repo", (error as Error).message);
  }
  const createdEvent: GitCasterEvent = createRepoCreatedEvent({
    actor: envelope.actor,
    repoId: repo.id,
    payload,
    timestamp: envelope.timestamp,
    signature: envelope.signature || null,
  });
  createRepoInStore(store, repo, createdEvent);
  const proofs = getRepoProofPlaceholders(store, repo.id).proofs;
  return {
    statusCode: 201,
    body: {
      type: "gitcaster.repo.create.result.v1",
      status: "alpha-local",
      repo,
      cloneUrl: repo.id,
      events: [createdEvent],
      proofs,
      notice: "Repo exists on local alpha node only.",
    },
  };
}

export function handleListRepos(store: LocalAlphaStore): RepoServiceResult {
  const repos = listRepos(store);
  return {
    statusCode: 200,
    body: {
      type: "gitcaster.repo.list.v1",
      status: "alpha-local",
      count: repos.length,
      repos,
    },
  };
}

export function handleGetRepo(store: LocalAlphaStore, owner: string, repoName: string): RepoServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) {
    return {
      statusCode: 404,
      body: {
        type: "gitcaster.repo.lookup.v1",
        status: "error",
        error: "repo_not_found",
        owner,
        repo: repoName,
      },
    };
  }
  return { statusCode: 200, body: { type: "gitcaster.repo.lookup.v1", status: "alpha-local", repo } };
}

export function handleGetRepoRefs(store: LocalAlphaStore, owner: string, repoName: string): RepoServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) return handleGetRepo(store, owner, repoName);
  const refs = listRepoRefs(store, repo.id);
  const ledgers = Object.fromEntries(refs.map((ref) => [ref.name, getRefLedger(store, repo.id, ref.name).entries]));
  return { statusCode: 200, body: { type: "gitcaster.repo.refs.v1", status: "alpha-local", repo: repo.id, refs, ledgers } };
}

export function handleGetRepoEvents(store: LocalAlphaStore, owner: string, repoName: string): RepoServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) return handleGetRepo(store, owner, repoName);
  return { statusCode: 200, body: { type: "gitcaster.repo.events.v1", status: "alpha-local", repo: repo.id, events: listRepoEvents(store, repo.id) } };
}

export function handleGetRepoTree(store: LocalAlphaStore, owner: string, repoName: string): RepoServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) return handleGetRepo(store, owner, repoName);
  const tree = getRepoTree(store, repo.id);
  if (tree.length) {
    return {
      statusCode: 200,
      body: {
        type: "gitcaster.repo.tree.v1",
        status: "alpha-local",
        repo: repo.id,
        ref: `refs/heads/${repo.defaultBranch}`,
        tree,
      },
    };
  }
  return {
    statusCode: 200,
    body: {
      type: "gitcaster.repo.tree.v1",
      status: "alpha-local",
      repo: repo.id,
      ref: `refs/heads/${repo.defaultBranch}`,
      tree: [],
      notice: "Tree is empty until push-local is implemented in PR-08.",
    },
  };
}

export function handleGetRepoProofs(store: LocalAlphaStore, owner: string, repoName: string): RepoServiceResult {
  const repo = getRepoByOwnerAndName(store, owner, repoName);
  if (!repo) return handleGetRepo(store, owner, repoName);
  const placeholders = getRepoProofPlaceholders(store, repo.id);
  return {
    statusCode: 200,
    body: {
      ...placeholders,
      proofs: {
        ...placeholders.proofs,
        repoManifest: {
          status: "alpha-local",
          hash: hashRepoManifest(repo),
        },
        objectStore: {
          status: "blocked",
          reason: "No object manifest exists until push-local is implemented in PR-08.",
        },
        qstorage: createQStorageBlockerProof({}),
        castercloud: createCasterCloudBlockerProof({}),
      },
    },
  };
}
