export type EvidenceLink = {
  label: string;
  path: string;
  status:
    | "verified"
    | "live"
    | "public-alpha"
    | "alpha-local"
    | "preview"
    | "blocked"
    | "requires-endpoint"
    | "requires-registry"
    | "proof-only";
};

export const evidenceLinks: EvidenceLink[] = [
  { label: "Public GitHub repo", path: "https://github.com/casteragents/gitcaster", status: "live" },
  { label: "Public GitCaster website", path: "https://casteragents.github.io/gitcaster/", status: "live" },
  { label: "Open-core boundary", path: "OPEN_CORE_BOUNDARY.md", status: "verified" },
  { label: "Apache 2.0 license", path: "LICENSE", status: "verified" },
  { label: "Commercial boundary notice", path: "COMMERCIAL_LICENSE.md", status: "verified" },
  { label: "Developer package workspace", path: "packages", status: "public-alpha" },
  { label: "PR-12 web truth UI", path: "launch/evidence/pr-12-web-status-proof-ui.json", status: "alpha-local" },
  { label: "TypeScript SDK source", path: "packages/sdk-typescript", status: "alpha-local" },
  { label: "CLI source", path: "apps/cli", status: "alpha-local" },
  { label: "MCP source", path: "apps/mcp", status: "alpha-local" },
  { label: "Canonical ecosystem preview", path: "docs/gitcaster-ecosystem.canonical.json", status: "preview" },
  { label: "QStorage publish", path: "blocked: CASTER_QSTORAGE_ENDPOINT", status: "requires-endpoint" },
  { label: "CasterCloud deploy", path: "blocked: CASTER_CLOUD_DEPLOY_ENDPOINT", status: "requires-endpoint" },
  { label: ".caster domains", path: "blocked: CASTER_DOMAIN_REGISTRY_ENDPOINT", status: "requires-registry" },
  { label: "$GITCASTER utility", path: "blocked: audited contracts and governance", status: "proof-only" }
];
