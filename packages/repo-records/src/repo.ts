import type { GitCasterRef, GitCasterRepo } from "../../protocol/dist/types.js";

const RESERVED_REPO_NAMES = new Set(["node", "mcp", "health", "qstorage", "castercloud", "domains", "ecosystem", "miniapps", "admin", "root", "null", "undefined"]);

export interface RepoNameValidationResult {
  ok: boolean;
  status: "alpha-local" | "error";
  name: string;
  slug: string;
  errors: string[];
}

export interface ParsedRepoId {
  ownerDid: string;
  repoName: string;
}

export interface RepoCreatePayload {
  type: "gitcaster.repo.create.payload.v1";
  name: string;
  description?: string;
  visibility?: "public" | "private" | "unlisted";
  defaultBranch?: string;
}

export interface RepoCreateResult {
  repo: GitCasterRepo;
  cloneUrl: string;
}

function assertCasterOwner(ownerDid: string): void {
  if (!ownerDid.startsWith("did:caster:")) throw new Error("owner must be did:caster");
}

export function slugifyRepoName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

export function validateRepoName(name: string): RepoNameValidationResult {
  const errors: string[] = [];
  const slug = slugifyRepoName(name);
  if (!name) errors.push("repo name missing");
  if (name !== slug) errors.push("repo name must already be slug-safe");
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(name)) errors.push("repo name must start with a letter or number and use lowercase letters, numbers, hyphen, or underscore");
  if (name.length > 80) errors.push("repo name max length is 80");
  if (/[\/\\:\s]/.test(name)) errors.push("repo name contains a forbidden separator or whitespace");
  if (name.includes("..")) errors.push("repo name cannot contain dot-dot");
  if (name.endsWith(".git")) errors.push("repo name cannot end with .git");
  if (RESERVED_REPO_NAMES.has(name)) errors.push("repo name is reserved");
  return { ok: errors.length === 0, status: errors.length === 0 ? "alpha-local" : "error", name, slug, errors };
}

export function repoIdFromOwnerAndName(ownerDid: string, repoName: string): string {
  assertCasterOwner(ownerDid);
  const validation = validateRepoName(repoName);
  if (!validation.ok) throw new Error(validation.errors.join("; "));
  return `gitcaster://${ownerDid}/${repoName}`;
}

export function parseGitCasterRepoId(repoId: string): ParsedRepoId | null {
  const prefix = "gitcaster://";
  if (!repoId.startsWith(prefix)) return null;
  const rest = repoId.slice(prefix.length);
  const separator = rest.lastIndexOf("/");
  if (separator <= 0) return null;
  const ownerDid = rest.slice(0, separator);
  const repoName = rest.slice(separator + 1);
  if (!ownerDid.startsWith("did:caster:")) return null;
  if (!validateRepoName(repoName).ok) return null;
  return { ownerDid, repoName };
}

export function createDefaultMainRef(repoId: string): GitCasterRef {
  return {
    type: "gitcaster.ref.v1",
    repo: repoId,
    name: "refs/heads/main",
    head: null,
    cid: null,
    certificate: null,
    updatedAt: new Date().toISOString(),
    status: "alpha-local",
  };
}

export function createGitCasterRepo(args: { ownerDid: string; payload: RepoCreatePayload; createdAt?: string }): GitCasterRepo {
  assertCasterOwner(args.ownerDid);
  const validation = validateRepoName(args.payload.name);
  if (!validation.ok) throw new Error(validation.errors.join("; "));
  const visibility = args.payload.visibility || "public";
  if (!["public", "private", "unlisted"].includes(visibility)) throw new Error("repo visibility must be public, private, or unlisted");
  const defaultBranch = args.payload.defaultBranch || "main";
  if (!/^[A-Za-z0-9._/-]{1,120}$/.test(defaultBranch) || defaultBranch.includes("..") || defaultBranch.startsWith("/") || defaultBranch.endsWith("/")) {
    throw new Error("default branch is invalid");
  }
  const createdAt = args.createdAt || new Date().toISOString();
  const id = repoIdFromOwnerAndName(args.ownerDid, args.payload.name);
  return {
    type: "gitcaster.repo.v1",
    id,
    did: id,
    name: args.payload.name,
    description: args.payload.description || "",
    owner: args.ownerDid,
    visibility,
    defaultBranch,
    refs: [{ ...createDefaultMainRef(id), name: `refs/heads/${defaultBranch}`, updatedAt: createdAt }],
    agents: [],
    deployments: [],
    tokenHooks: [],
    createdAt,
    updatedAt: createdAt,
    status: "alpha-local",
  };
}
