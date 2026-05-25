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

export const nodeTools: GitCasterMcpTool[] = [
  { name: "node_health", description: "Read local alpha node health.", inputSchema: TOOL_SCHEMAS.node_health, call: (_args, context) => nodeRead("node_health", "/health", context) },
  { name: "node_registry", description: "Read local alpha node registry.", inputSchema: TOOL_SCHEMAS.node_registry, call: (_args, context) => nodeRead("node_registry", "/node/registry", context) },
];
