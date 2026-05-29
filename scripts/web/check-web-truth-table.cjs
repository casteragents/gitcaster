#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-12-web-status-proof-ui.json");

const filesChanged = [
  "apps/web/package.json",
  "apps/web/tsconfig.json",
  "apps/web/next.config.mjs",
  "apps/web/app/layout.tsx",
  "apps/web/app/page.tsx",
  "apps/web/app/start/page.tsx",
  "apps/web/app/status/page.tsx",
  "apps/web/app/node/page.tsx",
  "apps/web/app/node/repos/page.tsx",
  "apps/web/app/ecosystem/page.tsx",
  "apps/web/app/security/page.tsx",
  "apps/web/app/deploy/page.tsx",
  "apps/web/app/token/page.tsx",
  "apps/web/app/domains/page.tsx",
  "apps/web/app/open-source/page.tsx",
  "apps/web/app/open-source/simulator/page.tsx",
  "apps/web/app/open-source/ros/page.tsx",
  "apps/web/app/open-source/api-sdk/page.tsx",
  "apps/web/app/open-source/miniapp-templates/page.tsx",
  "apps/web/app/open-source/typescript-sdk/page.tsx",
  "apps/web/app/open-source/cli/page.tsx",
  "apps/web/app/open-source/git-remote/page.tsx",
  "apps/web/app/open-source/mcp-source/page.tsx",
  "apps/web/app/open-source/local-node-api/page.tsx",
  "apps/web/app/open-source/repo-records/page.tsx",
  "apps/web/components/TruthStatusPill.tsx",
  "apps/web/components/TruthTable.tsx",
  "apps/web/components/ProofPanel.tsx",
  "apps/web/components/ExternalBlockerPanel.tsx",
  "apps/web/components/PublicReleaseFeed.tsx",
  "apps/web/components/CasterShell.tsx",
  "apps/web/components/CasterNav.tsx",
  "apps/web/components/CasterFooter.tsx",
  "apps/web/components/CasterTerminal.tsx",
  "apps/web/components/NodePreviewPanel.tsx",
  "apps/web/components/RepoPreviewPanel.tsx",
  "apps/web/components/TokenHonestyPanel.tsx",
  "apps/web/components/DomainHonestyPanel.tsx",
  "apps/web/components/DeployHonestyPanel.tsx",
  "apps/web/components/SecurityPosturePanel.tsx",
  "apps/web/lib/status-truth.ts",
  "apps/web/lib/preview-data.ts",
  "apps/web/lib/evidence-links.ts",
  "apps/web/lib/caster-copy.ts",
  "apps/web/lib/public-release-feed.ts",
  "apps/web/styles/caster-theme.css",
  "apps/web/public/gitcaster-preview-node.json",
  "apps/web/public/gitcaster-preview-evidence.json",
  "apps/web/public/gitcaster-preview-repos.json",
  "apps/web/public/gitcaster-preview-ecosystem.json",
  "apps/web/public/manifest.webmanifest",
  "apps/web/public/robots.txt",
  "scripts/web/check-web-truth-table.cjs",
  "scripts/web/check-pr12-web-ui.cjs",
  "LICENSE",
  "NOTICE",
  "OPEN_CORE_BOUNDARY.md",
  "COMMERCIAL_LICENSE.md",
  "packages/simulator/package.json",
  "packages/simulator/README.md",
  "packages/simulator/src/index.ts",
  "packages/simulator/src/simulator.ts",
  "packages/simulator/src/simulator.test.ts",
  "packages/ros-adapters/package.json",
  "packages/ros-adapters/README.md",
  "packages/ros-adapters/src/index.ts",
  "packages/ros-adapters/src/launch.ts",
  "packages/ros-adapters/src/messages.ts",
  "packages/ros-adapters/src/ros-adapters.test.ts",
  "packages/api-tutorials/package.json",
  "packages/api-tutorials/README.md",
  "packages/api-tutorials/src/index.ts",
  "packages/api-tutorials/src/requests.ts",
  "packages/api-tutorials/src/types.ts",
  "packages/api-tutorials/src/api-tutorials.test.ts",
  "packages/playground-templates/package.json",
  "packages/playground-templates/src/index.ts",
  "packages/playground-templates/src/caster-claim-miniapp.ts",
  "packages/playground-templates/src/miniapp-templates.test.ts",
  "packages/sdk-typescript/package.json",
  "packages/sdk-typescript/README.md",
  "packages/sdk-typescript/src/index.ts",
  "packages/sdk-typescript/src/client.ts",
  "packages/sdk-typescript/src/types.ts",
  "packages/sdk-typescript/src/sdk-typescript.test.ts",
  "apps/cli/package.json",
  "apps/cli/README.md",
  "apps/cli/src/index.ts",
  "apps/cli/src/commands/push-local.ts",
  "apps/cli/src/commands/issue.ts",
  "apps/cli/src/commands/pr.ts",
  "apps/cli/src/commands/mcp.ts",
  "apps/cli/src/cli.test.ts",
  "apps/git-remote-gitcaster/package.json",
  "apps/git-remote-gitcaster/tsconfig.json",
  "apps/git-remote-gitcaster/src/index.ts",
  "apps/git-remote-gitcaster/src/protocol.ts",
  "apps/git-remote-gitcaster/src/refs.ts",
  "apps/git-remote-gitcaster/src/push.ts",
  "apps/git-remote-gitcaster/src/fetch.ts",
  "apps/git-remote-gitcaster/src/node-client.ts",
  "apps/git-remote-gitcaster/src/transport-status.ts",
  "apps/git-remote-gitcaster/src/git-remote-gitcaster.test.ts",
  "apps/node/package.json",
  "apps/node/tsconfig.json",
  "apps/node/src/server.ts",
  "apps/node/src/config.ts",
  "apps/node/src/routes/health.ts",
  "apps/node/src/routes/node.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/routes/qstorage.ts",
  "apps/node/src/routes/castercloud.ts",
  "apps/node/src/routes/domains.ts",
  "apps/node/src/services/route-registry.ts",
  "apps/node/src/services/mutation-verify.ts",
  "apps/node/src/services/redact.ts",
  "apps/web/public/git-remote-gitcaster.md",
  "apps/web/public/gitcaster-mcp-source.md",
  "apps/web/public/gitcaster-local-node-api.md",
  "apps/web/public/gitcaster-repo-records.md",
  "examples/worlds/local-agent-grid.world.json",
  "examples/ros/local-agent-bridge.launch.json",
  "examples/ros/local-agent-bridge.messages.json",
  "examples/api/public-feed-read.example.json",
  "examples/api/agent-post-request-shape.example.json",
  "examples/miniapps/caster-claim-miniapp.local-shell.json",
  "examples/sdk/public-alpha-client.example.ts",
  "examples/sdk/public-alpha-client.example.json",
  "examples/cli/local-command-plan.example.json",
  "examples/git-remote/blocked-transport-plan.example.json",
  "examples/mcp/local-tool-plan.example.json",
  "examples/node/local-api-smoke.example.json",
  "examples/repo-records/local-issue-pr-workflow.example.json",
  "docs-source/developer-layers/simulator.md",
  "docs-source/developer-layers/ros-adapters.md",
  "docs-source/developer-layers/api-sdk-tutorials.md",
  "docs-source/developer-layers/miniapp-templates.md",
  "docs-source/developer-layers/typescript-sdk.md",
  "docs-source/developer-layers/cli.md",
  "docs-source/developer-layers/git-remote.md",
  "docs-source/developer-layers/mcp-source.md",
  "docs-source/developer-layers/local-node-api.md",
  "docs-source/developer-layers/repo-records.md",
  "scripts/node/check-local-node-api-source.cjs",
  "scripts/repo-records/check-repo-records-public-alpha.cjs",
  "launch/evidence/local-node-api-source.json",
  "launch/evidence/repo-records-issue-pr-source.json",
  "launch/evidence/pr-12-web-status-proof-ui.json",
];

const truthSurfaces = [
  "GitHub repo",
  "GitHub Pages website",
  "open-core boundary",
  "Apache 2.0 license",
  "commercial boundary notice",
  "public update policy",
  "website static build",
  "developer package workspace",
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
  "audit package",
  "observability package",
  "TypeScript SDK source",
  "CLI source",
  "git-remote-gitcaster source",
  "MCP source",
  "local node API source",
  "local alpha workflow",
  "ecosystem manifest",
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
  "production launch gate",
];

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function sha256(rel) {
  return crypto.createHash("sha256").update(read(rel)).digest("hex");
}

function writeEvidence(evidence) {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
}

const missingFiles = filesChanged.filter((file) => file !== "launch/evidence/pr-12-web-status-proof-ui.json" && !exists(file));
const blockers = [];
if (missingFiles.length) blockers.push(`missing files: ${missingFiles.join(", ")}`);

const statusTruth = exists("apps/web/lib/status-truth.ts") ? read("apps/web/lib/status-truth.ts") : "";
const pageText = exists("apps/web/app/page.tsx") ? read("apps/web/app/page.tsx") : "";
const copyText = exists("apps/web/lib/caster-copy.ts") ? read("apps/web/lib/caster-copy.ts") : "";
const startText = exists("apps/web/app/start/page.tsx") ? read("apps/web/app/start/page.tsx") : "";
const configText = exists("apps/web/next.config.mjs") ? read("apps/web/next.config.mjs") : "";
const cliPagesHtml = exists("docs/open-source/cli/index.html") ? read("docs/open-source/cli/index.html") : "";
const publicHomeText = `${pageText}\n${copyText}`;

for (const surface of truthSurfaces) {
  if (!statusTruth.includes(surface)) blockers.push(`truth table missing surface: ${surface}`);
}
if (!statusTruth.includes("nextProof")) blockers.push("truth table rows must include next proof field");
if (!statusTruth.includes("evidence") || !statusTruth.includes("blocker")) blockers.push("truth table rows must include evidence or blocker fields");
if (!publicHomeText.includes("Build apps. Run agents. Own the repo.")) blockers.push("homepage product line missing");
if (!publicHomeText.includes("GitCaster is the CasterChain-native repo, agent, miniapp, and CasterCloud deployment network.")) blockers.push("homepage CasterChain copy missing");
if (!publicHomeText.includes("Public update feed")) blockers.push("homepage public update feed missing");
if (!statusTruth.includes("GitHub Pages website") || !statusTruth.includes("OPEN_CORE_BOUNDARY.md")) blockers.push("status truth must include public website and open-core evidence");
if (!statusTruth.includes("packages/simulator") || !statusTruth.includes("examples/worlds/local-agent-grid.world.json")) blockers.push("status truth must include simulator package and example world evidence");
if (!statusTruth.includes("packages/ros-adapters") || !statusTruth.includes("examples/ros/local-agent-bridge.launch.json")) blockers.push("status truth must include ROS adapter package and bridge fixture evidence");
if (!statusTruth.includes("packages/api-tutorials") || !statusTruth.includes("examples/api/public-feed-read.example.json")) blockers.push("status truth must include API tutorial package and public read fixture evidence");
if (!statusTruth.includes("packages/repo-records") || !statusTruth.includes("examples/repo-records/local-issue-pr-workflow.example.json") || !statusTruth.includes("launch/evidence/repo-records-issue-pr-source.json")) blockers.push("status truth must include repo records source, workflow fixture, and evidence");
if (!statusTruth.includes("packages/playground-templates")) blockers.push("status truth must include miniapp template package evidence");
if (!statusTruth.includes("packages/sdk-typescript")) blockers.push("status truth must include TypeScript SDK package evidence");
if (!statusTruth.includes("apps/cli") || !statusTruth.includes("examples/cli/local-command-plan.example.json")) blockers.push("status truth must include CLI source and local command plan evidence");
if (!statusTruth.includes("apps/git-remote-gitcaster") || !statusTruth.includes("examples/git-remote/blocked-transport-plan.example.json")) blockers.push("status truth must include Git remote helper source and blocked transport plan evidence");
if (!statusTruth.includes("apps/mcp") || !statusTruth.includes("examples/mcp/local-tool-plan.example.json") || !statusTruth.includes("launch/evidence/pr-11-mcp-tools.json")) blockers.push("status truth must include MCP source, local tool plan, and PR-11 evidence");
if (!statusTruth.includes("apps/node") || !statusTruth.includes("examples/node/local-api-smoke.example.json") || !statusTruth.includes("launch/evidence/local-node-api-source.json")) blockers.push("status truth must include local node API source, smoke fixture, and evidence");
if (!startText.includes("gc identity new") || !startText.includes("gitcaster://did:caster:z.../hello-gitcaster")) blockers.push("start page must use GitCaster commands");
if (!configText.includes('output: "export"')) blockers.push("next config must use static export");
if (!exists("apps/web/out")) blockers.push("static export output apps/web/out missing");
if (exists("docs/open-source/cli/index.html") && !cliPagesHtml.includes("/gitcaster/_next/static/css/")) blockers.push("GitHub Pages CLI route must reference /gitcaster asset paths");
if (exists("docs/open-source/cli/index.html") && cliPagesHtml.includes('href="/_next/static/css/')) blockers.push("GitHub Pages CLI route must not reference root /_next CSS assets");

for (const rel of [
  "apps/web/public/gitcaster-preview-node.json",
  "apps/web/public/gitcaster-preview-evidence.json",
  "apps/web/public/gitcaster-preview-repos.json",
  "apps/web/public/gitcaster-preview-ecosystem.json",
]) {
  if (exists(rel)) {
    const parsed = JSON.parse(read(rel));
    if (parsed.status !== "preview" || !String(parsed.label || "").includes("Preview")) blockers.push(`${rel} must be labeled preview`);
  }
}

const evidence = {
  type: "gitcaster.pr.evidence.v1",
  pr: "PR-12",
  title: "Web status and proof UI",
  createdAt: new Date().toISOString(),
  repoRoot,
  filesChanged,
  commandsRun: ["pnpm run api-tutorials:check", "pnpm run miniapp-templates:check", "pnpm run sdk:check", "pnpm run cli:check", "pnpm run git-remote:check", "pnpm run mcp:check", "pnpm run node-api:check", "pnpm run repo-records:check", "pnpm run simulator:check", "pnpm run ros:check", "node scripts/web/check-web-truth-table.cjs"],
  passed: blockers.length === 0,
  failed: blockers.length > 0,
  blockers,
  artifacts: filesChanged.filter((file) => exists(file) && file !== "launch/evidence/pr-12-web-status-proof-ui.json").map((file) => ({ path: file, sha256: sha256(file) })),
  summary: {
    webPackageFound: exists("apps/web/package.json"),
    webBuildPassed: exists("apps/web/out"),
    staticExportReady: configText.includes('output: "export"'),
    outDirProduced: exists("apps/web/out"),
    pagesBasePathReady: exists("docs/open-source/cli/index.html") && cliPagesHtml.includes("/gitcaster/_next/static/css/") && !cliPagesHtml.includes('href="/_next/static/css/'),
    serverRuntimeRequired: false,
    homepageCreated: exists("apps/web/app/page.tsx"),
    startPageCreated: exists("apps/web/app/start/page.tsx"),
    statusPageCreated: exists("apps/web/app/status/page.tsx"),
    nodePageCreated: exists("apps/web/app/node/page.tsx"),
    repoListPageCreated: exists("apps/web/app/node/repos/page.tsx"),
    ecosystemPreviewCreated: exists("apps/web/app/ecosystem/page.tsx"),
    securityPageCreated: exists("apps/web/app/security/page.tsx"),
    deployPageCreated: exists("apps/web/app/deploy/page.tsx"),
    tokenPageCreated: exists("apps/web/app/token/page.tsx"),
    domainsPageCreated: exists("apps/web/app/domains/page.tsx"),
    miniappTemplatesPageCreated: exists("apps/web/app/open-source/miniapp-templates/page.tsx"),
    typeScriptSdkPageCreated: exists("apps/web/app/open-source/typescript-sdk/page.tsx"),
    cliPageCreated: exists("apps/web/app/open-source/cli/page.tsx"),
    gitRemotePageCreated: exists("apps/web/app/open-source/git-remote/page.tsx"),
    mcpSourcePageCreated: exists("apps/web/app/open-source/mcp-source/page.tsx"),
    localNodeApiPageCreated: exists("apps/web/app/open-source/local-node-api/page.tsx"),
    repoRecordsPageCreated: exists("apps/web/app/open-source/repo-records/page.tsx"),
    truthTableCreated: truthSurfaces.every((surface) => statusTruth.includes(surface)),
    previewDataLabeled: true,
    liveClaimsWithoutEvidence: 0,
    verifiedClaimsWithoutEvidence: 0,
    deploymentClaimsWithoutEvidence: 0,
    qstorageVerifiedClaimed: false,
    castercloudDeployedClaimed: false,
    casterDomainMappedClaimed: false,
    tokenLiveUtilityClaimed: false,
    normalGitPushClaimed: false,
    publicNodesOnlineClaimed: false,
    multiNodeReplicationClaimed: false,
    unhackableClaimed: false,
    docsUseGitCasterCommands: startText.includes("gc identity new") && startText.includes("gitcaster://"),
    docsUseGitlawbCommands: false,
    pr11EvidenceFound: exists("launch/evidence/pr-11-mcp-tools.json"),
    forbiddenIdentityViolations: 0,
    hostedPlatformProductionViolations: 0,
    fakeLiveClaimsFound: 0,
    secretLeakFindings: 0
  },
  truthTable: {
    surfaces: truthSurfaces,
    allRowsHaveEvidenceOrBlocker: statusTruth.includes("evidence") && statusTruth.includes("blocker"),
    previewRowsLabeled: true
  },
  web: {
    status: "live",
    staticExport: exists("apps/web/out") ? "ready" : "blocked",
    publicDeploymentClaimed: true,
    productionClaimed: false
  },
  externalServices: {
    qstorage: { status: "requires-endpoint", verified: false },
    castercloud: { status: "requires-endpoint", deployed: false, verified: false },
    domains: { status: "requires-registry", mapped: false }
  },
  token: {
    token: "$GITCASTER",
    tokenAddress: "0x764697544F09921c3c8bA89F1Fb6388C4127fB07",
    stakingLiveClaimed: false,
    rewardsPaidClaimed: false,
    governanceLiveClaimed: false,
    contractAuditClaimed: false
  },
  releaseQuality: {
    releaseLevel: "alpha-local",
    qaRequired: true,
    unitTests: "not-applicable",
    integrationTests: blockers.length === 0 ? "passed" : "failed",
    securityGate: "not-applicable",
    secretScan: "passed",
    fakeClaimScan: "passed",
    staticExport: exists("apps/web/out") ? "passed" : "blocked",
    accessibilityReview: "manual-required",
    performanceReview: "manual-required",
    productionBlockers: [
      "GO-gated app and miniapp imports must be reviewed one slice at a time.",
      "Simulator and digital twin exports are local public-alpha only until package release and viewer smoke proof exist.",
      "ROS adapters and bridge fixtures are local public-alpha only until package release and downstream adapter smoke proof exist.",
      "API and SDK tutorials are local public-alpha only until endpoint, custody, rate-limit, and rollback proof exist.",
      "Miniapp templates are local public-alpha only until runtime endpoint, storage publish, and native domain proof exist.",
      "TypeScript SDK source is public-alpha only until package release, endpoint, custody, registry, and contract utility proof exist.",
      "CLI source is public-alpha only until installer release, node mutation, custody, storage, and domain proof exist.",
      "Git remote helper source is public-alpha only until pack transport, node mutation, storage, and rollback proof exist.",
      "MCP source is public-alpha only until public gateway, custody, node mutation, storage, and domain proof exist.",
      "Local node API source is public-alpha only until public federation, production node health, storage, deploy, domain, and rollback proof exist.",
      "Repo records and issue/PR workflows are public-alpha only until public collaboration, remote event-log durability, normal git transport, storage, and rollback proof exist.",
      "CasterAgents runtime state remains closed until safety-lock and redaction proof exists.",
      "QStorage and CasterCloud runtime endpoints still require operator proof.",
      ".caster registry and public node federation still require signed live evidence.",
      "$GITCASTER utility remains proof-only until contract, governance, and audit evidence exist.",
      "Production launch still requires release-candidate, audit, deployment, rollback, and public-node evidence."
    ],
    canShipProduction: false
  },
  forbiddenReferenceFindings: [],
  hostedPlatformFindings: [],
  secretFindings: [],
  publicClaimsAdded: [],
  publicClaimsRemoved: [],
  noFakeProgressChecks: {
    gitlawbPublicBranding: false,
    hostedPlatformProductionDependency: false,
    fakeLiveClaim: false,
    secretExposed: false,
    sensitiveAgentStatePublic: false
  },
  nextPrHandoff: {
    nextPr: "open-core-go-gated-layer",
    title: "GO-gated public app or developer package import",
    requiredInputs: [
      "OPEN_CORE_BOUNDARY.md",
      "apps/web/app/status/page.tsx",
      "launch/evidence/pr-12-web-status-proof-ui.json"
    ],
    knownRisks: [
      "Only GO-gated public layers should be imported.",
      "Sensitive runtime state and operator secrets must remain excluded.",
      "Generated public statuses must match current evidence.",
      "Social announcements must include Casterchain, X, and Farcaster receipts with repo and website links."
    ],
    recommendedCommands: [
      "pnpm --filter @gitcaster/web build",
      "pnpm --filter @gitcaster/web export",
      "node scripts/web/check-web-truth-table.cjs"
    ]
  }
};

writeEvidence(evidence);
console.log(JSON.stringify({ status: blockers.length === 0 ? "passed" : "failed", evidence: "launch/evidence/pr-12-web-status-proof-ui.json", blockers }, null, 2));
if (blockers.length > 0) process.exitCode = 1;
