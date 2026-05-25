import type { RouteRegistry } from "../services/route-registry.js";

export const MCP_TOOLS = [
  "identity_show",
  "identity_sign",
  "node_health",
  "node_registry",
  "repo_create",
  "repo_list",
  "repo_get",
  "repo_clone_url",
  "git_refs",
  "ref_certificate_get",
  "ref_certificate_verify",
  "issue_create",
  "issue_list",
  "pr_create",
  "pr_list",
  "pr_view",
  "pr_review",
  "pr_merge",
  "object_manifest_get",
  "object_manifest_verify",
  "qstorage_verify",
  "castercloud_verify",
  "ecosystem_index",
  "miniapp_import",
  "miniapp_compat_check",
  "caster_token_info",
  "domain_request",
  "domain_status",
  "security_proof_gate",
  "launch_evidence_bundle",
];

export function registerMcpRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/mcp/tools", () => ({
    statusCode: 200,
    body: {
      type: "gitcaster.mcp.tools.v1",
      status: "alpha-local",
      tools: MCP_TOOLS,
      notice: "MCP server implementation is PR-11. PR-04 exposes only node metadata.",
    },
  }));
}
