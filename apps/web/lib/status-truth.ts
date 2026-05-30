export type GitCasterTruthStatus =
  | "verified"
  | "live"
  | "alpha-local"
  | "public-alpha"
  | "preview"
  | "proof-only"
  | "blocked"
  | "requires-endpoint"
  | "requires-contract"
  | "requires-audit"
  | "requires-governance"
  | "requires-registry"
  | "legacy-reference"
  | "error";

export type TruthSeverity = "good" | "info" | "warn" | "danger" | "neutral";

export type TruthTableRow = {
  surface: string;
  status: GitCasterTruthStatus;
  evidence?: string;
  blocker?: string;
  nextProof: string;
};

export const TRUTH_SURFACES = [
  "GitHub repo",
  "GitHub Pages website",
  "open-core boundary",
  "Apache 2.0 license",
  "commercial boundary notice",
  "public update policy",
  "website static build",
  "developer package workspace",
  "deploy manifest intake",
  "deploy manifest local dry-run fixture",
  "deploy manifest production blockers",
  "simulator package",
  "example world fixture",
  "digital twin exporter",
  "ROS adapter package",
  "ROS bridge fixture",
  "robot message schema",
  "API tutorial package",
  "public API read fixture",
  "agent post request fixture",
  "protocol package",
  "identity package",
  "capabilities package",
  "repo records package",
  "object store package",
  "ref consensus package",
  "security package",
  "security redteam tooling",
  "audit package",
  "observability package",
  "TypeScript SDK source",
  "CLI source",
  "CLI deploy plan dry-run",
  "CLI deploy plan evidence",
  "CLI deploy plan blockers",
  "git-remote-gitcaster source",
  "MCP source",
  "agent skills notes",
  "agent skills local fixture",
  "agent skills promotion blockers",
  "local node API source",
  "local alpha workflow",
  "ecosystem manifest",
  "app shell catalog",
  "app shell local preview fixture",
  "app shell local preview smoke",
  "app shell local preview evidence",
  "app shell preview promotion blockers",
  "app shell dependency-risk labels",
  "Caster Intelligence preview shell",
  "Caster Intelligence fixture",
  "Caster Intelligence promotion blockers",
  "Claim Miniapp template",
  "Caster Punks index",
  "CasterAgents",
  "$GITCASTER token address",
  "$GITCASTER utility",
  "QStorage publish",
  "CasterCloud deploy",
  ".caster domains",
  "public node federation",
  "hosted installer",
  "security audit",
  "production QA",
  "production launch gate"
] as const;

export const TRUTH_STATUSES: GitCasterTruthStatus[] = [
  "verified",
  "live",
  "alpha-local",
  "public-alpha",
  "preview",
  "proof-only",
  "blocked",
  "requires-endpoint",
  "requires-contract",
  "requires-audit",
  "requires-governance",
  "requires-registry",
  "legacy-reference",
  "error"
];

export function statusLabel(status: GitCasterTruthStatus): string {
  return status;
}

export function statusDescription(status: GitCasterTruthStatus): string {
  const descriptions: Record<GitCasterTruthStatus, string> = {
    verified: "Direct evidence exists for this claim.",
    live: "Direct current evidence exists for this online surface.",
    "alpha-local": "Available in the local alpha workflow only.",
    "public-alpha": "Public alpha evidence exists.",
    preview: "Preview data only; not canonical state.",
    "proof-only": "Tracked as proof material without settled utility.",
    blocked: "Blocked until the named proof or external input exists.",
    "requires-endpoint": "Requires a configured endpoint and proof.",
    "requires-contract": "Requires deployed and audited contract evidence.",
    "requires-audit": "Requires external security review evidence.",
    "requires-governance": "Requires governance evidence.",
    "requires-registry": "Requires registry proof.",
    "legacy-reference": "Reference only; not GitCaster identity.",
    error: "Evidence or configuration is invalid."
  };
  return descriptions[status];
}

export function statusSeverity(status: GitCasterTruthStatus): TruthSeverity {
  if (status === "verified" || status === "live" || status === "public-alpha") return "good";
  if (status === "alpha-local" || status === "preview" || status === "proof-only") return "info";
  if (status.startsWith("requires-") || status === "legacy-reference") return "warn";
  if (status === "blocked" || status === "error") return "danger";
  return "neutral";
}

export function isEvidenceBackedStatus(status: GitCasterTruthStatus, evidence?: string): boolean {
  if (status === "verified" || status === "live" || status === "public-alpha") return Boolean(evidence);
  return true;
}

export function truthTableRows(): TruthTableRow[] {
  return [
    { surface: "GitHub repo", status: "live", evidence: "https://github.com/casteragents/gitcaster", nextProof: "Signed release tag and package checks" },
    { surface: "GitHub Pages website", status: "live", evidence: "https://casteragents.github.io/gitcaster/", nextProof: "Independent uptime and browser smoke evidence" },
    { surface: "open-core boundary", status: "verified", evidence: "OPEN_CORE_BOUNDARY.md", nextProof: "Per-layer GO proof before each larger import" },
    { surface: "Apache 2.0 license", status: "verified", evidence: "LICENSE", nextProof: "Third-party license inventory for each new imported layer" },
    { surface: "commercial boundary notice", status: "verified", evidence: "COMMERCIAL_LICENSE.md", nextProof: "Commercial service terms outside the public repo" },
    { surface: "public update policy", status: "verified", evidence: "README.md", nextProof: "Automated social receipt checker" },
    { surface: "website static build", status: "verified", evidence: "launch/evidence/pr-12-web-status-proof-ui.json", nextProof: "Fresh browser smoke after every public push" },
    { surface: "developer package workspace", status: "public-alpha", evidence: "packages", nextProof: "Package-level release manifests" },
    { surface: "deploy manifest intake", status: "public-alpha", evidence: "packages/deploy-manifests; scripts/deploy/check-deploy-manifest-intake-public-alpha.cjs; launch/evidence/deploy-manifest-intake-public-alpha.json", nextProof: "Managed runtime deploy receipt, native storage, native domain, custody, billing, rollback, and release-candidate proof" },
    { surface: "deploy manifest local dry-run fixture", status: "public-alpha", evidence: "examples/deploy/local-deploy-manifest.example.json", nextProof: "Per-app local manifest fixtures and browser smoke proof" },
    { surface: "deploy manifest production blockers", status: "public-alpha", evidence: "packages/deploy-manifests/src/deploy-manifest.ts", nextProof: "Signed promotion receipts before any stronger deployment labels" },
    { surface: "simulator package", status: "public-alpha", evidence: "packages/simulator", nextProof: "Published package artifact and tutorial smoke" },
    { surface: "example world fixture", status: "public-alpha", evidence: "examples/worlds/local-agent-grid.world.json", nextProof: "Additional rights-reviewed example worlds" },
    { surface: "digital twin exporter", status: "public-alpha", evidence: "packages/simulator/src/simulator.ts", nextProof: "Exporter schema versioning and viewer smoke proof" },
    { surface: "ROS adapter package", status: "public-alpha", evidence: "packages/ros-adapters", nextProof: "Published package artifact and tutorial smoke" },
    { surface: "ROS bridge fixture", status: "public-alpha", evidence: "examples/ros/local-agent-bridge.launch.json", nextProof: "Additional local bridge fixtures and docs" },
    { surface: "robot message schema", status: "public-alpha", evidence: "packages/ros-adapters/src/messages.ts", nextProof: "Schema versioning and downstream adapter tests" },
    { surface: "API tutorial package", status: "public-alpha", evidence: "packages/api-tutorials", nextProof: "Published tutorial artifact and endpoint proof" },
    { surface: "public API read fixture", status: "public-alpha", evidence: "examples/api/public-feed-read.example.json", nextProof: "Public read endpoint smoke proof" },
    { surface: "agent post request fixture", status: "public-alpha", evidence: "examples/api/agent-post-request-shape.example.json", nextProof: "Private custody and rate-limit proof" },
    { surface: "protocol package", status: "alpha-local", evidence: "packages/protocol", nextProof: "Published package artifact" },
    { surface: "identity package", status: "alpha-local", evidence: "packages/identity", nextProof: "Published package artifact and key custody review" },
    { surface: "capabilities package", status: "alpha-local", evidence: "packages/capabilities", nextProof: "Capability abuse test evidence" },
    { surface: "repo records package", status: "public-alpha", evidence: "packages/repo-records; examples/repo-records/local-issue-pr-workflow.example.json; launch/evidence/repo-records-issue-pr-source.json", nextProof: "Remote Caster event-log durability, public collaboration, normal git transport, storage, and rollback proof" },
    { surface: "object store package", status: "public-alpha", evidence: "packages/object-store; examples/push-local/local-object-manifest.example.json; launch/evidence/push-local-object-store-source.json", nextProof: "QStorage publication, normal git transport, remote ref durability, public object hosting, and rollback proof" },
    { surface: "ref consensus package", status: "public-alpha", evidence: "packages/ref-consensus; examples/refs/local-ref-certificate-workflow.example.json; launch/evidence/ref-consensus-local-certificate-source.json", nextProof: "Signed public consensus, remote ref durability, normal git transport, storage, and rollback proof" },
    { surface: "security package", status: "alpha-local", evidence: "packages/security", nextProof: "External audit evidence" },
    { surface: "security redteam tooling", status: "public-alpha", evidence: "scripts/security; scripts/security/redteam; examples/security/redteam-hardening-plan.example.json; launch/evidence/security-redteam-public-hardening-source.json", nextProof: "External security audit, managed infrastructure, public-node, custody, billing, rollback, and production operation proof" },
    { surface: "audit package", status: "alpha-local", evidence: "packages/audit", nextProof: "License and data-rights review evidence" },
    { surface: "observability package", status: "alpha-local", evidence: "packages/observability", nextProof: "Live incident drill evidence" },
    { surface: "TypeScript SDK source", status: "public-alpha", evidence: "packages/sdk-typescript", nextProof: "Package release, endpoint, custody, and registry proof" },
    { surface: "CLI source", status: "public-alpha", evidence: "apps/cli; examples/cli/local-command-plan.example.json", nextProof: "Installer, node mutation, custody, storage, and domain proof" },
    { surface: "CLI deploy plan dry-run", status: "public-alpha", evidence: "apps/cli/src/commands/deploy.ts; examples/deploy/local-deploy-manifest.example.json", nextProof: "Installer, managed runtime, native storage, native domain, custody, billing, rollback, and release-candidate proof" },
    { surface: "CLI deploy plan evidence", status: "public-alpha", evidence: "launch/evidence/cli-deploy-plan-local-dry-run.json; launch/evidence/cli-deploy-plan-public-alpha.json; apps/web/public/gitcaster-cli-deploy-plan.json", nextProof: "Public user install smoke and signed promotion receipts" },
    { surface: "CLI deploy plan blockers", status: "public-alpha", evidence: "scripts/cli/check-cli-deploy-plan-public-alpha.cjs", nextProof: "Deterministic receipts before any runtime, storage, domain, custody, billing, rollback, or production label" },
    { surface: "git-remote-gitcaster source", status: "public-alpha", evidence: "apps/git-remote-gitcaster; examples/git-remote/blocked-transport-plan.example.json", nextProof: "Git transport RC evidence" },
    { surface: "MCP source", status: "public-alpha", evidence: "apps/mcp; examples/mcp/local-tool-plan.example.json; launch/evidence/pr-11-mcp-tools.json", nextProof: "Public MCP gateway, custody, node mutation, storage, and domain proof" },
    { surface: "agent skills notes", status: "public-alpha", evidence: "docs/agent-skills.md; apps/web/app/open-source/agent-skills/page.tsx; apps/web/public/gitcaster-agent-skills.json; launch/evidence/agent-skills-public-smoke.json", nextProof: "Independent browser smoke, public gateway, managed custody, node mutation, storage, domain, rollback, and release-candidate proof" },
    { surface: "agent skills local fixture", status: "public-alpha", evidence: "examples/mcp/local-tool-plan.example.json; apps/web/public/agent-skills.md", nextProof: "Signed local-user install smoke and tool-plan acceptance proof" },
    { surface: "agent skills promotion blockers", status: "public-alpha", evidence: "scripts/mcp/check-agent-skills-public-alpha.cjs; launch/evidence/agent-skills-public-alpha.json", nextProof: "Deterministic receipts before public gateway, custody, storage, domain, or production labels" },
    { surface: "local node API source", status: "public-alpha", evidence: "apps/node; examples/node/local-api-smoke.example.json; launch/evidence/local-node-api-source.json", nextProof: "Signed public node federation, storage, deploy, domain, and rollback proof" },
    { surface: "local alpha workflow", status: "alpha-local", evidence: "apps/web/app/start/page.tsx", nextProof: "End-to-end local install smoke" },
    { surface: "ecosystem manifest", status: "preview", evidence: "docs/gitcaster-ecosystem.canonical.json", nextProof: "GO-gated import proof for each public app" },
    { surface: "app shell catalog", status: "public-alpha", evidence: "packages/ecosystem/src/app-shell-catalog.ts; apps/web/public/gitcaster-app-shell-catalog.json; launch/evidence/app-shell-catalog-public-hardening-source.json", nextProof: "Per-shell security review, native storage, native domain, runtime endpoint, and rollback proof" },
    { surface: "app shell local preview fixture", status: "public-alpha", evidence: "examples/app-shells/gitcaster-app-shell-catalog.local.json", nextProof: "Browser smoke for each local preview route" },
    { surface: "app shell local preview smoke", status: "public-alpha", evidence: "scripts/ecosystem/check-app-shell-local-preview-smoke-public-alpha.cjs; apps/web/public/gitcaster-app-shell-local-preview-smoke.json", nextProof: "Independent public browser smoke and signed route receipts" },
    { surface: "app shell local preview evidence", status: "public-alpha", evidence: "launch/evidence/app-shell-local-preview-smoke-public-alpha.json; apps/web/public/gitcaster-app-shell-local-preview-smoke.md", nextProof: "Per-shell public user smoke receipts" },
    { surface: "app shell preview promotion blockers", status: "public-alpha", evidence: "scripts/ecosystem/check-app-shell-local-preview-smoke-public-alpha.cjs", nextProof: "Native storage, native domain, managed runtime, rollback, and security review proof" },
    { surface: "app shell dependency-risk labels", status: "public-alpha", evidence: "scripts/ecosystem/check-app-shell-catalog-public-alpha.cjs", nextProof: "Public native dependency retirement proof for each shell" },
    { surface: "Caster Intelligence preview shell", status: "public-alpha", evidence: "apps/web/app/ecosystem/caster-intelligence/page.tsx; apps/web/app/open-source/caster-intelligence-preview/page.tsx; apps/web/public/gitcaster-caster-intelligence-preview.json; launch/evidence/caster-intelligence-preview-public-smoke.json", nextProof: "External user smoke, source rights review, native storage, native domain, runtime endpoint, and rollback proof" },
    { surface: "Caster Intelligence fixture", status: "public-alpha", evidence: "examples/app-shells/caster-intelligence.local-shell.json; scripts/ecosystem/check-caster-intelligence-preview-public-alpha.cjs; launch/evidence/caster-intelligence-preview-public-alpha.json", nextProof: "Reviewer-signed source scope and data-rights proof" },
    { surface: "Caster Intelligence promotion blockers", status: "public-alpha", evidence: "scripts/ecosystem/check-caster-intelligence-preview-public-alpha.cjs", nextProof: "Deterministic proof before source contents, runtime, storage, domain, rollback, or production labels" },
    { surface: "Claim Miniapp template", status: "public-alpha", evidence: "packages/playground-templates/src/caster-claim-miniapp.ts", nextProof: "Runtime endpoint, storage publish, and native domain proof" },
    { surface: "Caster Punks index", status: "preview", evidence: "docs/caster-punks-index.json", nextProof: "Rights-reviewed public index-only proof" },
    { surface: "CasterAgents", status: "blocked", blocker: "Runtime state remains protected; only safe interfaces can be imported after review.", nextProof: "Safety-lock and redaction evidence" },
    { surface: "$GITCASTER token address", status: "proof-only", evidence: "apps/web/app/token/page.tsx", nextProof: "Contract, governance, and audit evidence" },
    { surface: "$GITCASTER utility", status: "proof-only", blocker: "$GITCASTER utility remains planned/proof-only in this public repo.", nextProof: "Contract and audit evidence" },
    { surface: "QStorage publish", status: "requires-endpoint", blocker: "QStorage endpoint/write/verify proof is not included in the public repo.", nextProof: "QStorage endpoint publish evidence" },
    { surface: "CasterCloud deploy", status: "requires-endpoint", blocker: "Managed CasterCloud deployment proof is not included in the public repo.", nextProof: "CasterCloud release evidence" },
    { surface: ".caster domains", status: "requires-registry", blocker: ".caster registry proof is not included in the public repo.", nextProof: "Domain registry evidence" },
    { surface: "public node federation", status: "blocked", blocker: "No signed public multi-node health proof is included here.", nextProof: "Signed node health proof" },
    { surface: "hosted installer", status: "blocked", blocker: "Hosted installer proof is not included in the public repo.", nextProof: "Installer release evidence" },
    { surface: "security audit", status: "requires-audit", blocker: "External security audit evidence is not included in the public repo.", nextProof: "Security audit report" },
    { surface: "production QA", status: "blocked", blocker: "Production QA acceptance evidence is not included in the public repo.", nextProof: "Production QA acceptance evidence" },
    { surface: "production launch gate", status: "blocked", blocker: "Production launch remains blocked until release-candidate, audit, deployment, rollback, and public-node evidence are all present.", nextProof: "Production launch gate evidence" }
  ];
}
