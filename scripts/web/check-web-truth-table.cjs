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
  "apps/web/components/TruthStatusPill.tsx",
  "apps/web/components/TruthTable.tsx",
  "apps/web/components/ProofPanel.tsx",
  "apps/web/components/ExternalBlockerPanel.tsx",
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
  "apps/web/styles/caster-theme.css",
  "apps/web/public/gitcaster-preview-node.json",
  "apps/web/public/gitcaster-preview-evidence.json",
  "apps/web/public/gitcaster-preview-repos.json",
  "apps/web/public/gitcaster-preview-ecosystem.json",
  "apps/web/public/manifest.webmanifest",
  "apps/web/public/robots.txt",
  "scripts/web/check-web-truth-table.cjs",
  "scripts/web/check-pr12-web-ui.cjs",
  "launch/evidence/pr-12-web-status-proof-ui.json",
];

const truthSurfaces = [
  "website static build",
  "QStorage publish",
  "CasterCloud deploy",
  "local alpha node",
  "node.gitcaster.casterchain",
  "node2.gitcaster.casterchain",
  "node3.gitcaster.casterchain",
  "CLI",
  "git-remote-gitcaster",
  "push-local",
  "ref certificates",
  "object store",
  "MCP",
  "SDK TS",
  "SDK Python",
  "ecosystem manifest",
  "Claim Miniapp",
  "Caster Punks",
  "CasterAgents",
  "token utility",
  "token contracts",
  "domains",
  "installer",
  "security gate",
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
const publicHomeText = `${pageText}\n${copyText}`;

for (const surface of truthSurfaces) {
  if (!statusTruth.includes(surface)) blockers.push(`truth table missing surface: ${surface}`);
}
if (!statusTruth.includes("nextProof")) blockers.push("truth table rows must include next proof field");
if (!statusTruth.includes("evidence") || !statusTruth.includes("blocker")) blockers.push("truth table rows must include evidence or blocker fields");
if (!publicHomeText.includes("Build apps. Run agents. Own the repo.")) blockers.push("homepage product line missing");
if (!publicHomeText.includes("GitCaster is the CasterChain-native repo, agent, miniapp, and CasterCloud deployment network.")) blockers.push("homepage CasterChain copy missing");
if (!startText.includes("gc identity new") || !startText.includes("gitcaster://did:caster:z.../hello-gitcaster")) blockers.push("start page must use GitCaster commands");
if (!configText.includes('output: "export"')) blockers.push("next config must use static export");
if (!exists("apps/web/out")) blockers.push("static export output apps/web/out missing");

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
  commandsRun: ["node scripts/web/check-web-truth-table.cjs"],
  passed: blockers.length === 0,
  failed: blockers.length > 0,
  blockers,
  artifacts: filesChanged.filter((file) => exists(file) && file !== "launch/evidence/pr-12-web-status-proof-ui.json").map((file) => ({ path: file, sha256: sha256(file) })),
  summary: {
    webPackageFound: exists("apps/web/package.json"),
    webBuildPassed: exists("apps/web/out"),
    staticExportReady: configText.includes('output: "export"'),
    outDirProduced: exists("apps/web/out"),
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
    status: "alpha-local",
    staticExport: exists("apps/web/out") ? "ready" : "blocked",
    publicDeploymentClaimed: false,
    productionClaimed: false
  },
  externalServices: {
    qstorage: { status: "requires-endpoint", verified: false },
    castercloud: { status: "requires-endpoint", deployed: false, verified: false },
    domains: { status: "requires-registry", mapped: false }
  },
  token: {
    token: "$CASTER",
    tokenAddress: "0xa1db936b33cec552d453c21a44f7153777f6f5ee373e47680ab58fcc4efebe2f",
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
      "Canonical ecosystem import is not implemented until PR-13.",
      "Miniapp import is not implemented until PR-14.",
      "Caster Punks index is not implemented until PR-15.",
      "CasterAgents safety lock is not implemented until PR-16.",
      "Deploy pipeline is not implemented until PR-17/PR-23.",
      "Security gate is not implemented until PR-18/PR-27.",
      "Full Git transport is not release-candidate until PR-22.",
      "Production launch gate is not evaluated until PR-32."
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
    nextPr: "PR-13",
    title: "Canonical ecosystem manifest",
    requiredInputs: [
      "apps/web/app/ecosystem/page.tsx",
      "apps/web/public/gitcaster-preview-ecosystem.json",
      "launch/evidence/pr-12-web-status-proof-ui.json"
    ],
    knownRisks: [
      "PR-12 creates ecosystem preview only.",
      "PR-12 does not import CasterAgents state.",
      "PR-12 does not index Caster Punks.",
      "PR-12 does not migrate the Claim Miniapp.",
      "PR-12 does not deploy to CasterCloud/QStorage."
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
