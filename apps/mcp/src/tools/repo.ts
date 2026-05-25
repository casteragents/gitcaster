import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import { nodeGet, resolveGitCasterNodeUrl, redactNodeError } from "../node-client.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

async function nodeRead(tool: string, path: string, context: Parameters<GitCasterMcpTool["call"]>[1]) {
  if (!resolveGitCasterNodeUrl(context.env)) return blockedToolResult(tool, "GITCASTER_NODE or CASTER_NODE_URL is required.");
  try {
    return { status: "alpha-local" as const, tool, result: await nodeGet(path, context), evidence: "launch/evidence/pr-11-mcp-tools.json" };
  } catch (error) {
    return { status: "blocked" as const, tool, result: { reason: "Local alpha node request failed.", error: redactNodeError(error) }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
  }
}

function ownerRepoPath(args: Record<string, unknown>): string | null {
  const owner = typeof args.owner === "string" ? args.owner : null;
  const repo = typeof args.repo === "string" ? args.repo : null;
  if (!owner || !repo) return null;
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

export const repoTools: GitCasterMcpTool[] = [
  { name: "repo_list", description: "List local alpha repos.", inputSchema: TOOL_SCHEMAS.repo_list, call: (_args, context) => nodeRead("repo_list", "/repos", context) },
  {
    name: "repo_get",
    description: "Read one local alpha repo.",
    inputSchema: TOOL_SCHEMAS.repo_get,
    call: (args, context) => {
      const path = ownerRepoPath(args);
      if (!path) return blockedToolResult("repo_get", "owner and repo arguments are required.");
      return nodeRead("repo_get", path, context);
    },
  },
  {
    name: "repo_clone_url",
    description: "Return a GitCaster repo URL from valid repo metadata without claiming pack clone support.",
    inputSchema: TOOL_SCHEMAS.repo_clone_url,
    call: (args) => {
      const repoId = typeof args.repoId === "string" ? args.repoId : null;
      if (!repoId || !repoId.startsWith("gitcaster://did:caster:")) return blockedToolResult("repo_clone_url", "Valid gitcaster:// repo metadata is required.");
      return { status: "alpha-local", tool: "repo_clone_url", result: { cloneUrl: repoId, packTransportClaimed: false }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
    },
  },
  { name: "repo_create", description: "Create a repo only when signing identity is configured.", inputSchema: TOOL_SCHEMAS.repo_create, call: () => blockedToolResult("repo_create", "repo_create requires local CasterDID identity and signing key.") },
];
