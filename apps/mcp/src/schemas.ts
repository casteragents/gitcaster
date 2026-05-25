export const REQUIRED_BETA_TOOLS = [
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
  "issue_update",
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
] as const;

export type RequiredBetaTool = (typeof REQUIRED_BETA_TOOLS)[number];

export const TOOL_SCHEMAS: Record<RequiredBetaTool, Record<string, unknown>> = Object.fromEntries(
  REQUIRED_BETA_TOOLS.map((name) => [name, { type: "object", properties: {}, additionalProperties: true }]),
) as unknown as Record<RequiredBetaTool, Record<string, unknown>>;
