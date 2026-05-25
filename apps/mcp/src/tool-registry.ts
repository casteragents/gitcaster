import { TOOL_SCHEMAS, type RequiredBetaTool } from "./schemas.js";
import { identityTools } from "./tools/identity.js";
import { nodeTools } from "./tools/node.js";
import { repoTools } from "./tools/repo.js";
import { refsTools } from "./tools/refs.js";
import { issueTools } from "./tools/issues.js";
import { prTools } from "./tools/prs.js";
import { objectTools } from "./tools/object.js";
import { qstorageTools } from "./tools/qstorage.js";
import { castercloudTools } from "./tools/castercloud.js";
import { ecosystemTools } from "./tools/ecosystem.js";
import { miniappTools } from "./tools/miniapp.js";
import { domainTools } from "./tools/domain.js";
import { tokenTools } from "./tools/token.js";
import { securityTools } from "./tools/security.js";
import { evidenceTools } from "./tools/evidence.js";
import { blockedToolResult, redactToolResult } from "./blockers.js";

export type GitCasterMcpToolStatus = "alpha-local" | "preview" | "blocked" | "proof-only" | "requires-endpoint" | "requires-registry" | "requires-contract" | "error";

export interface GitCasterMcpContext {
  env: NodeJS.ProcessEnv;
  cwd: string;
  timeoutMs?: number;
}

export interface GitCasterMcpToolResult {
  status: GitCasterMcpToolStatus;
  tool: string;
  result: unknown;
  evidence?: string;
  notice?: string;
}

export interface GitCasterMcpTool {
  name: RequiredBetaTool;
  description: string;
  inputSchema: Record<string, unknown>;
  call: (args: Record<string, unknown>, context: GitCasterMcpContext) => Promise<GitCasterMcpToolResult> | GitCasterMcpToolResult;
}

export function createToolRegistry(_context: GitCasterMcpContext): GitCasterMcpTool[] {
  return [
    ...identityTools,
    ...nodeTools,
    ...repoTools,
    ...refsTools,
    ...issueTools,
    ...prTools,
    ...objectTools,
    ...qstorageTools,
    ...castercloudTools,
    ...ecosystemTools,
    ...miniappTools,
    ...domainTools,
    ...tokenTools,
    ...securityTools,
    ...evidenceTools,
  ];
}

export function listTools(context: GitCasterMcpContext): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return createToolRegistry(context).map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema || TOOL_SCHEMAS[tool.name] }));
}

export async function callTool(name: string, args: Record<string, unknown>, context: GitCasterMcpContext): Promise<GitCasterMcpToolResult> {
  const tool = createToolRegistry(context).find((item) => item.name === name);
  if (!tool) return blockedToolResult(name, "Unknown GitCaster MCP tool.");
  try {
    return redactToolResult(await tool.call(args || {}, context)) as GitCasterMcpToolResult;
  } catch (error) {
    return {
      status: "error",
      tool: name,
      result: { reason: error instanceof Error ? error.message : "tool failed" },
      evidence: "launch/evidence/pr-11-mcp-tools.json",
      notice: "Tool failed without exposing secrets.",
    };
  }
}
