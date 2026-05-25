import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import { nodeGet, resolveGitCasterNodeUrl, redactNodeError } from "../node-client.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

function ownerRepoPath(args: Record<string, unknown>, suffix: string): string | null {
  const owner = typeof args.owner === "string" ? args.owner : null;
  const repo = typeof args.repo === "string" ? args.repo : null;
  if (!owner || !repo) return null;
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`;
}

async function refs(args: Record<string, unknown>, context: Parameters<GitCasterMcpTool["call"]>[1]) {
  const path = ownerRepoPath(args, "/refs");
  if (!path) return blockedToolResult("git_refs", "owner and repo arguments are required.");
  if (!resolveGitCasterNodeUrl(context.env)) return blockedToolResult("git_refs", "GITCASTER_NODE or CASTER_NODE_URL is required.");
  try {
    return { status: "alpha-local" as const, tool: "git_refs", result: await nodeGet(path, context), evidence: "launch/evidence/pr-11-mcp-tools.json" };
  } catch (error) {
    return { status: "blocked" as const, tool: "git_refs", result: { reason: "Ref list request failed.", error: redactNodeError(error) }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
  }
}

export const refsTools: GitCasterMcpTool[] = [
  { name: "git_refs", description: "Read local alpha refs.", inputSchema: TOOL_SCHEMAS.git_refs, call: refs },
  {
    name: "ref_certificate_get",
    description: "Return local alpha ref certificate data if present.",
    inputSchema: TOOL_SCHEMAS.ref_certificate_get,
    call: async (args, context) => {
      const result = await refs(args, context);
      if (result.status !== "alpha-local") return { ...result, tool: "ref_certificate_get" };
      const refsBody = result.result as { refs?: Array<{ certificate?: unknown }> };
      const certificate = refsBody.refs?.find((ref) => ref.certificate)?.certificate || null;
      return certificate ? { status: "alpha-local", tool: "ref_certificate_get", result: { certificate }, evidence: "launch/evidence/pr-11-mcp-tools.json" } : blockedToolResult("ref_certificate_get", "No local alpha ref certificate is present.");
    },
  },
  {
    name: "ref_certificate_verify",
    description: "Verify local certificate structure only.",
    inputSchema: TOOL_SCHEMAS.ref_certificate_verify,
    call: (args) => {
      const cert = args.certificate as Record<string, unknown> | undefined;
      if (!cert || cert.type !== "gitcaster.ref.update.v1") return blockedToolResult("ref_certificate_verify", "A local ref certificate object is required.");
      return { status: "alpha-local", tool: "ref_certificate_verify", result: { structureValid: true, publicConsensusClaimed: false }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
    },
  },
];
