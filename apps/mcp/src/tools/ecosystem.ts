import { blockedToolResult } from "../blockers.js";
import { nodeGet, resolveGitCasterNodeUrl, redactNodeError } from "../node-client.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const ecosystemTools: GitCasterMcpTool[] = [
  {
    name: "ecosystem_index",
    description: "Read ecosystem preview from local alpha node when available.",
    inputSchema: TOOL_SCHEMAS.ecosystem_index,
    call: async (_args, context) => {
      if (!resolveGitCasterNodeUrl(context.env)) return blockedToolResult("ecosystem_index", "Ecosystem import is deferred; configure local node to read preview index.");
      try {
        return { status: "preview", tool: "ecosystem_index", result: await nodeGet("/ecosystem", context), evidence: "launch/evidence/pr-11-mcp-tools.json" };
      } catch (error) {
        return { status: "blocked", tool: "ecosystem_index", result: { reason: "Ecosystem preview request failed.", error: redactNodeError(error) }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
      }
    },
  },
];
