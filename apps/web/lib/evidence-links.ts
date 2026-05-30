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
  { label: "Deploy manifest package", path: "packages/deploy-manifests", status: "public-alpha" },
  { label: "Deploy manifest fixture", path: "examples/deploy/local-deploy-manifest.example.json", status: "public-alpha" },
  { label: "Deploy manifest evidence", path: "launch/evidence/deploy-manifest-intake-public-alpha.json", status: "public-alpha" },
  { label: "Simulator package", path: "packages/simulator", status: "public-alpha" },
  { label: "Example world fixture", path: "examples/worlds/local-agent-grid.world.json", status: "public-alpha" },
  { label: "Digital twin exporter", path: "packages/simulator/src/simulator.ts", status: "public-alpha" },
  { label: "ROS adapter package", path: "packages/ros-adapters", status: "public-alpha" },
  { label: "ROS bridge fixture", path: "examples/ros/local-agent-bridge.launch.json", status: "public-alpha" },
  { label: "Robot message schema", path: "packages/ros-adapters/src/messages.ts", status: "public-alpha" },
  { label: "API tutorial package", path: "packages/api-tutorials", status: "public-alpha" },
  { label: "Public API read fixture", path: "examples/api/public-feed-read.example.json", status: "public-alpha" },
  { label: "Agent post request fixture", path: "examples/api/agent-post-request-shape.example.json", status: "public-alpha" },
  { label: "Repo records source", path: "packages/repo-records", status: "public-alpha" },
  { label: "Repo records local workflow fixture", path: "examples/repo-records/local-issue-pr-workflow.example.json", status: "public-alpha" },
  { label: "Repo records local workflow evidence", path: "launch/evidence/repo-records-issue-pr-source.json", status: "public-alpha" },
  { label: "Object store source", path: "packages/object-store", status: "public-alpha" },
  { label: "Push-local object manifest fixture", path: "examples/push-local/local-object-manifest.example.json", status: "public-alpha" },
  { label: "Push-local object store evidence", path: "launch/evidence/push-local-object-store-source.json", status: "public-alpha" },
  { label: "Ref consensus source", path: "packages/ref-consensus", status: "public-alpha" },
  { label: "Local ref certificate fixture", path: "examples/refs/local-ref-certificate-workflow.example.json", status: "public-alpha" },
  { label: "Ref consensus local certificate evidence", path: "launch/evidence/ref-consensus-local-certificate-source.json", status: "public-alpha" },
  { label: "Security redteam tooling", path: "scripts/security", status: "public-alpha" },
  { label: "Security redteam fixture", path: "examples/security/redteam-hardening-plan.example.json", status: "public-alpha" },
  { label: "Security redteam evidence", path: "launch/evidence/security-redteam-public-hardening-source.json", status: "public-alpha" },
  { label: "Miniapp template package", path: "packages/playground-templates", status: "public-alpha" },
  { label: "Caster Claim local shell fixture", path: "examples/miniapps/caster-claim-miniapp.local-shell.json", status: "public-alpha" },
  { label: "TypeScript SDK source", path: "packages/sdk-typescript", status: "public-alpha" },
  { label: "SDK local client example", path: "examples/sdk/public-alpha-client.example.ts", status: "public-alpha" },
  { label: "CLI source", path: "apps/cli", status: "public-alpha" },
  { label: "CLI local command plan", path: "examples/cli/local-command-plan.example.json", status: "public-alpha" },
  { label: "CLI deploy plan command", path: "apps/cli/src/commands/deploy.ts", status: "public-alpha" },
  { label: "CLI deploy plan local evidence", path: "launch/evidence/cli-deploy-plan-local-dry-run.json", status: "public-alpha" },
  { label: "CLI deploy plan public evidence", path: "launch/evidence/cli-deploy-plan-public-alpha.json", status: "public-alpha" },
  { label: "Git remote helper source", path: "apps/git-remote-gitcaster", status: "public-alpha" },
  { label: "Git remote blocked transport plan", path: "examples/git-remote/blocked-transport-plan.example.json", status: "public-alpha" },
  { label: "MCP source", path: "apps/mcp", status: "public-alpha" },
  { label: "MCP local tool plan", path: "examples/mcp/local-tool-plan.example.json", status: "public-alpha" },
  { label: "PR-11 MCP tool evidence", path: "launch/evidence/pr-11-mcp-tools.json", status: "public-alpha" },
  { label: "Local node API source", path: "apps/node", status: "public-alpha" },
  { label: "Local node API smoke fixture", path: "examples/node/local-api-smoke.example.json", status: "public-alpha" },
  { label: "Local node API evidence", path: "launch/evidence/local-node-api-source.json", status: "public-alpha" },
  { label: "PR-12 web truth UI", path: "launch/evidence/pr-12-web-status-proof-ui.json", status: "alpha-local" },
  { label: "Canonical ecosystem preview", path: "docs/gitcaster-ecosystem.canonical.json", status: "preview" },
  { label: "App shell catalog source", path: "packages/ecosystem/src/app-shell-catalog.ts", status: "public-alpha" },
  { label: "App shell catalog fixture", path: "examples/app-shells/gitcaster-app-shell-catalog.local.json", status: "public-alpha" },
  { label: "App shell catalog evidence", path: "launch/evidence/app-shell-catalog-public-hardening-source.json", status: "public-alpha" },
  { label: "App shell local preview smoke", path: "apps/web/public/gitcaster-app-shell-local-preview-smoke.json", status: "public-alpha" },
  { label: "App shell local preview evidence", path: "launch/evidence/app-shell-local-preview-smoke-public-alpha.json", status: "public-alpha" },
  { label: "QStorage publish", path: "blocked: CASTER_QSTORAGE_ENDPOINT", status: "requires-endpoint" },
  { label: "CasterCloud deploy", path: "blocked: CASTER_CLOUD_DEPLOY_ENDPOINT", status: "requires-endpoint" },
  { label: ".caster domains", path: "blocked: CASTER_DOMAIN_REGISTRY_ENDPOINT", status: "requires-registry" },
  { label: "$GITCASTER utility", path: "blocked: audited contracts and governance", status: "proof-only" }
];
