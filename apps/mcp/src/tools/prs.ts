import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import { nodeGet, resolveGitCasterNodeUrl, redactNodeError } from "../node-client.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

function prPath(args: Record<string, unknown>, id = false): string | null {
  const owner = typeof args.owner === "string" ? args.owner : null;
  const repo = typeof args.repo === "string" ? args.repo : null;
  const prId = typeof args.prId === "string" ? args.prId : null;
  if (!owner || !repo || (id && !prId)) return null;
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs${id ? `/${encodeURIComponent(prId || "")}` : ""}`;
}

async function readPrTool(tool: "pr_list" | "pr_view", args: Record<string, unknown>, context: Parameters<GitCasterMcpTool["call"]>[1]) {
  const path = prPath(args, tool === "pr_view");
  if (!path) return blockedToolResult(tool, "owner, repo, and prId where applicable are required.");
  if (!resolveGitCasterNodeUrl(context.env)) return blockedToolResult(tool, "GITCASTER_NODE or CASTER_NODE_URL is required.");
  try {
    return { status: "alpha-local" as const, tool, result: await nodeGet(path, context), evidence: "launch/evidence/pr-11-mcp-tools.json" };
  } catch (error) {
    return { status: "blocked" as const, tool, result: { reason: "PR request failed.", error: redactNodeError(error) }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
  }
}

export const prTools: GitCasterMcpTool[] = [
  { name: "pr_create", description: "Create PR only with configured signing identity.", inputSchema: TOOL_SCHEMAS.pr_create, call: () => blockedToolResult("pr_create", "pr_create requires local CasterDID identity and signing key.") },
  { name: "pr_list", description: "List local alpha PRs.", inputSchema: TOOL_SCHEMAS.pr_list, call: (args, context) => readPrTool("pr_list", args, context) },
  { name: "pr_view", description: "View local alpha PR.", inputSchema: TOOL_SCHEMAS.pr_view, call: (args, context) => readPrTool("pr_view", args, context) },
  { name: "pr_review", description: "Review PR only with configured signing identity.", inputSchema: TOOL_SCHEMAS.pr_review, call: () => blockedToolResult("pr_review", "pr_review requires local CasterDID identity and signing key.") },
  { name: "pr_merge", description: "Merge PR only with configured signing identity and local record-only proof.", inputSchema: TOOL_SCHEMAS.pr_merge, call: () => blockedToolResult("pr_merge", "pr_merge requires local CasterDID identity and signing key.") },
];
