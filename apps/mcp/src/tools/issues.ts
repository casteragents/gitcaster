import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import { nodeGet, resolveGitCasterNodeUrl, redactNodeError } from "../node-client.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

function issuePath(args: Record<string, unknown>): string | null {
  const owner = typeof args.owner === "string" ? args.owner : null;
  const repo = typeof args.repo === "string" ? args.repo : null;
  if (!owner || !repo) return null;
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
}

export const issueTools: GitCasterMcpTool[] = [
  { name: "issue_create", description: "Create issue only with configured signing identity.", inputSchema: TOOL_SCHEMAS.issue_create, call: () => blockedToolResult("issue_create", "issue_create requires local CasterDID identity and signing key.") },
  {
    name: "issue_list",
    description: "List local alpha issues.",
    inputSchema: TOOL_SCHEMAS.issue_list,
    call: async (args, context) => {
      const path = issuePath(args);
      if (!path) return blockedToolResult("issue_list", "owner and repo arguments are required.");
      if (!resolveGitCasterNodeUrl(context.env)) return blockedToolResult("issue_list", "GITCASTER_NODE or CASTER_NODE_URL is required.");
      try {
        return { status: "alpha-local", tool: "issue_list", result: await nodeGet(path, context), evidence: "launch/evidence/pr-11-mcp-tools.json" };
      } catch (error) {
        return { status: "blocked", tool: "issue_list", result: { reason: "Issue list request failed.", error: redactNodeError(error) }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
      }
    },
  },
  { name: "issue_update", description: "Update issue only with configured signing identity.", inputSchema: TOOL_SCHEMAS.issue_update, call: () => blockedToolResult("issue_update", "issue_update requires local CasterDID identity and signing key.") },
];
