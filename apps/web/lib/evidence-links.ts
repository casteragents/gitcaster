export type EvidenceLink = {
  label: string;
  path: string;
  status: "alpha-local" | "preview" | "blocked" | "requires-endpoint" | "requires-registry" | "proof-only";
};

export const evidenceLinks: EvidenceLink[] = [
  { label: "PR-08 push-local", path: "launch/evidence/pr-08-push-local.json", status: "alpha-local" },
  { label: "PR-09 remote helper", path: "launch/evidence/pr-09-git-remote-helper.json", status: "alpha-local" },
  { label: "PR-10 issues and PRs", path: "launch/evidence/pr-10-issues-prs.json", status: "alpha-local" },
  { label: "PR-11 MCP tools", path: "launch/evidence/pr-11-mcp-tools.json", status: "alpha-local" },
  { label: "PR-12 web truth UI", path: "launch/evidence/pr-12-web-status-proof-ui.json", status: "alpha-local" },
  { label: "QStorage publish", path: "blocked: CASTER_QSTORAGE_ENDPOINT", status: "requires-endpoint" },
  { label: "CasterCloud deploy", path: "blocked: CASTER_CLOUD_DEPLOY_ENDPOINT", status: "requires-endpoint" },
  { label: ".caster domains", path: "blocked: CASTER_DOMAIN_REGISTRY_ENDPOINT", status: "requires-registry" },
  { label: "$CASTER utility", path: "blocked: audited contracts and governance", status: "proof-only" }
];
