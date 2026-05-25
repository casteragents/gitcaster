import { getNodeRepoRefs, resolveGitCasterNodeUrl } from "./node-client.js";
import { parseGitCasterUrl } from "./protocol.js";

export interface GitCasterRemoteRefResult {
  type: "gitcaster.remote.refs.v1";
  status: "alpha-local" | "blocked" | "error";
  remoteUrl: string;
  refs: Array<{ name: string; head: string | null; cid?: string | null }>;
  reason?: string;
}

export async function listRefsForRemote(args: {
  remoteUrl: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}): Promise<GitCasterRemoteRefResult> {
  const parsed = parseGitCasterUrl(args.remoteUrl);
  const nodeUrl = resolveGitCasterNodeUrl(args.env, parsed);
  const refs = await getNodeRepoRefs({ nodeUrl, ownerDid: parsed.ownerDid, repo: parsed.repo, timeoutMs: args.timeoutMs });
  return {
    type: "gitcaster.remote.refs.v1",
    status: refs.status,
    remoteUrl: args.remoteUrl,
    refs: refs.refs,
    reason: refs.reason,
  };
}

export function parseRefListResponse(response: unknown): GitCasterRemoteRefResult {
  if (!response || typeof response !== "object") throw new Error("ref response must be an object");
  const value = response as Partial<GitCasterRemoteRefResult>;
  if (!Array.isArray(value.refs)) throw new Error("ref response must contain refs");
  return {
    type: "gitcaster.remote.refs.v1",
    status: value.status || "blocked",
    remoteUrl: value.remoteUrl || "",
    refs: value.refs,
    reason: value.reason,
  };
}

export function formatRefsForGitRemoteHelper(result: GitCasterRemoteRefResult): string {
  if (result.status !== "alpha-local") return `# ${result.status}: ${result.reason || "ref listing unavailable"}\n`;
  if (result.refs.length === 0) return "";
  return result.refs.map((ref) => `${ref.head || "?"} ${ref.name}`).join("\n") + "\n";
}
