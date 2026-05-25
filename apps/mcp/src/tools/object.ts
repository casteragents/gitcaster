import { blockedToolResult } from "../blockers.js";
import { nodeGet, resolveGitCasterNodeUrl, redactNodeError } from "../node-client.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

function proofPath(args: Record<string, unknown>): string | null {
  const owner = typeof args.owner === "string" ? args.owner : null;
  const repo = typeof args.repo === "string" ? args.repo : null;
  if (!owner || !repo) return null;
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/proofs`;
}

export const objectTools: GitCasterMcpTool[] = [
  {
    name: "object_manifest_get",
    description: "Read local alpha object manifest proof from repo proofs.",
    inputSchema: TOOL_SCHEMAS.object_manifest_get,
    call: async (args, context) => {
      const path = proofPath(args);
      if (!path) return blockedToolResult("object_manifest_get", "owner and repo arguments are required.");
      if (!resolveGitCasterNodeUrl(context.env)) return blockedToolResult("object_manifest_get", "GITCASTER_NODE or CASTER_NODE_URL is required.");
      try {
        const proof = await nodeGet(path, context) as { proofs?: { objectManifest?: unknown } };
        const manifest = proof.proofs?.objectManifest;
        if (!manifest || (manifest as { status?: string }).status === "blocked") return blockedToolResult("object_manifest_get", "No local alpha object manifest is present.");
        return { status: "alpha-local", tool: "object_manifest_get", result: { manifest }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
      } catch (error) {
        return { status: "blocked", tool: "object_manifest_get", result: { reason: "Object manifest lookup failed.", error: redactNodeError(error) }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
      }
    },
  },
  {
    name: "object_manifest_verify",
    description: "Verify local object manifest structure only.",
    inputSchema: TOOL_SCHEMAS.object_manifest_verify,
    call: (args) => {
      const manifest = args.manifest as { rootHash?: unknown; objectCount?: unknown; status?: string } | undefined;
      if (!manifest || typeof manifest.rootHash !== "string") return blockedToolResult("object_manifest_verify", "A local object manifest proof is required.");
      return { status: "alpha-local", tool: "object_manifest_verify", result: { structureValid: true, qstorageProofClaimed: false }, evidence: "launch/evidence/pr-11-mcp-tools.json" };
    },
  },
];
