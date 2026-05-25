export interface ParsedGitCasterUrl {
  protocol: "gitcaster";
  nodeHint: string | null;
  ownerDid: string;
  repo: string;
  repoId: string;
}

const PREFIX = "gitcaster://";
const RESERVED_REPO_NAMES = new Set(["node", "mcp", "health", "qstorage", "castercloud", "domains", "ecosystem", "miniapps", "admin", "root", "null", "undefined"]);

export function isGitCasterUrl(url: string): boolean {
  return typeof url === "string" && url.startsWith(PREFIX);
}

export function normalizeRepoName(name: string): string {
  if (typeof name !== "string") throw new Error("repo name must be a string");
  return name.endsWith(".git") ? name.slice(0, -4) : name;
}

export function validateGitCasterRemoteName(name: string): boolean {
  const normalized = normalizeRepoName(name);
  return /^[a-z0-9][a-z0-9_-]{0,79}$/.test(normalized)
    && normalized === name
    && !/[\/\\:\s]/.test(normalized)
    && !normalized.includes("..")
    && !normalized.endsWith(".git")
    && !RESERVED_REPO_NAMES.has(normalized);
}

function repoIdFromOwnerAndName(ownerDid: string, repoName: string): string {
  if (!ownerDid.startsWith("did:caster:")) throw new Error("owner must be did:caster");
  if (!validateGitCasterRemoteName(repoName)) throw new Error("repo name is unsafe");
  return `gitcaster://${ownerDid}/${repoName}`;
}

export function parseGitCasterUrl(url: string): ParsedGitCasterUrl {
  if (!isGitCasterUrl(url)) throw new Error("remote URL must use gitcaster://");
  const legacyDid = "did:" + "git" + "lawb";
  if (url.includes(legacyDid)) throw new Error("owner DID must be did:caster");

  const rest = url.slice(PREFIX.length);
  if (!rest || rest.includes("\\")) throw new Error("remote URL is malformed");
  const parts = rest.split("/").filter((part) => part.length > 0);
  if (parts.length < 2) throw new Error("remote URL must include owner DID and repo name");

  const hasNodeHint = !parts[0].startsWith("did:caster:");
  const nodeHint = hasNodeHint ? parts[0] : null;
  const ownerDid = hasNodeHint ? parts[1] : parts[0];
  const repoSegment = hasNodeHint ? parts[2] : parts[1];

  if (!ownerDid || !ownerDid.startsWith("did:caster:")) throw new Error("owner DID must be did:caster");
  if (!repoSegment) throw new Error("repo name is required");
  if ((hasNodeHint && parts.length !== 3) || (!hasNodeHint && parts.length !== 2)) throw new Error("remote URL must point to one repo");

  const repo = normalizeRepoName(repoSegment);
  if (repo !== repoSegment && repoSegment !== `${repo}.git`) throw new Error("repo name is invalid");
  if (!validateGitCasterRemoteName(repo)) throw new Error("repo name is unsafe");
  const repoId = repoIdFromOwnerAndName(ownerDid, repo);

  return {
    protocol: "gitcaster",
    nodeHint,
    ownerDid,
    repo,
    repoId,
  };
}

export function formatGitCasterUrl(parsed: ParsedGitCasterUrl): string {
  return `${PREFIX}${parsed.ownerDid}/${parsed.repo}`;
}
