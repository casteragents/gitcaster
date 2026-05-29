#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-12-web-status-proof-ui.json");
const packageOnly = process.argv.includes("--package-only");

const requiredFiles = [
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
  "examples/worlds/local-agent-grid.world.json",
  "examples/ros/local-agent-bridge.launch.json",
  "examples/ros/local-agent-bridge.messages.json",
  "examples/api/public-feed-read.example.json",
  "examples/api/agent-post-request-shape.example.json",
  "examples/miniapps/caster-claim-miniapp.local-shell.json",
  "docs-source/developer-layers/simulator.md",
  "docs-source/developer-layers/ros-adapters.md",
  "docs-source/developer-layers/api-sdk-tutorials.md",
  "docs-source/developer-layers/miniapp-templates.md",
  "launch/evidence/pr-12-web-status-proof-ui.json"
];

const publicScanFiles = requiredFiles.filter((file) => file.startsWith("apps/web/"));
const blockers = [];
const findings = {
  missingFiles: [],
  forbiddenReferenceFindings: [],
  hostedPlatformFindings: [],
  secretFindings: [],
  fakeClaimFindings: [],
  sensitiveStateFindings: []
};

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function add(kind, file, reason) {
  findings[kind].push({ file, reason });
  blockers.push(`${file}: ${reason}`);
}

for (const file of requiredFiles) {
  if (!exists(file)) {
    findings.missingFiles.push(file);
    blockers.push(`missing file: ${file}`);
  }
}

for (const file of publicScanFiles.filter(exists)) {
  const text = read(file);
  if (/(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i.test(text)) {
    add("forbiddenReferenceFindings", file, "legacy public identity string found");
  }
  if (/(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i.test(text)) {
    add("hostedPlatformFindings", file, "hosted platform production dependency mention found");
  }
  if (/(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|seed phrase|mnemonic|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/.test(text)) {
    add("secretFindings", file, "secret-like content found");
  }
  const textForFakeClaimScan = text.replace(/No system is unhackable\./gi, "");
  if (/(live decentralized network|deployed to CasterCloud|QStorage verified|CasterCloud verified|\.caster mapped|staking live|rewards paid|governance live|mirrored to 3 nodes|normal git push works|production-ready|unhackable|public nodes online|multi-node replicated)/i.test(textForFakeClaimScan)) {
    add("fakeClaimFindings", file, "fake live or production claim found");
  }
  if (/(casteragents-projects|processedIds|pendingReplies|pendingPosts|balances\.json|rankings\.json|casterpunks.*\.(jpg|jpeg|png|webp)|punks.*\.(jpg|jpeg|png|webp))/i.test(text)) {
    add("sensitiveStateFindings", file, "sensitive CasterAgents state or Caster Punks image reference found");
  }
}

let evidence = {};
if (!packageOnly) {
  if (!exists("launch/evidence/pr-12-web-status-proof-ui.json")) {
    blockers.push("PR-12 evidence missing");
  } else {
    evidence = JSON.parse(read("launch/evidence/pr-12-web-status-proof-ui.json"));
    if (evidence.type !== "gitcaster.pr.evidence.v1") blockers.push("evidence type must be gitcaster.pr.evidence.v1");
    if (evidence.pr !== "PR-12") blockers.push("evidence must identify PR-12");
    if (evidence.releaseQuality?.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false");
    if (evidence.summary?.truthTableCreated !== true) blockers.push("truthTableCreated must be true");
    if (evidence.summary?.previewDataLabeled !== true) blockers.push("previewDataLabeled must be true");
    if (evidence.summary?.serverRuntimeRequired !== false) blockers.push("serverRuntimeRequired must be false");
    if (evidence.summary?.docsUseGitCasterCommands !== true) blockers.push("docsUseGitCasterCommands must be true");
    if (evidence.summary?.qstorageVerifiedClaimed !== false) blockers.push("qstorageVerifiedClaimed must be false");
    if (evidence.summary?.castercloudDeployedClaimed !== false) blockers.push("castercloudDeployedClaimed must be false");
    if (evidence.summary?.casterDomainMappedClaimed !== false) blockers.push("casterDomainMappedClaimed must be false");
    if (evidence.summary?.tokenLiveUtilityClaimed !== false) blockers.push("tokenLiveUtilityClaimed must be false");
    if (evidence.summary?.normalGitPushClaimed !== false) blockers.push("normalGitPushClaimed must be false");
    if (evidence.summary?.publicNodesOnlineClaimed !== false) blockers.push("publicNodesOnlineClaimed must be false");
    if (evidence.summary?.multiNodeReplicationClaimed !== false) blockers.push("multiNodeReplicationClaimed must be false");
    if (evidence.summary?.unhackableClaimed !== false) blockers.push("unhackableClaimed must be false");
    if (!Array.isArray(evidence.truthTable?.surfaces) || evidence.truthTable.surfaces.length !== 46) blockers.push("truth table must include 46 current surfaces");
    if (!evidence.truthTable?.surfaces?.includes("GitHub Pages website")) blockers.push("truth table must include GitHub Pages website");
    if (!evidence.truthTable?.surfaces?.includes("open-core boundary")) blockers.push("truth table must include open-core boundary");
    if (!evidence.truthTable?.surfaces?.includes("simulator package")) blockers.push("truth table must include simulator package");
    if (!evidence.truthTable?.surfaces?.includes("ROS adapter package")) blockers.push("truth table must include ROS adapter package");
    if (!evidence.truthTable?.surfaces?.includes("API tutorial package")) blockers.push("truth table must include API tutorial package");
    if (!evidence.truthTable?.surfaces?.includes("Claim Miniapp template")) blockers.push("truth table must include Claim Miniapp template");
  }
}

if (evidence && Object.keys(evidence).length) {
  evidence.commandsRun = Array.from(new Set([...(evidence.commandsRun || []), "node scripts/web/check-pr12-web-ui.cjs"]));
  evidence.passed = blockers.length === 0;
  evidence.failed = blockers.length > 0;
  evidence.blockers = blockers;
  evidence.forbiddenReferenceFindings = findings.forbiddenReferenceFindings;
  evidence.hostedPlatformFindings = findings.hostedPlatformFindings;
  evidence.secretFindings = findings.secretFindings;
  evidence.publicClaimsAdded = findings.fakeClaimFindings;
  if (evidence.summary) {
    evidence.summary.forbiddenIdentityViolations = findings.forbiddenReferenceFindings.length;
    evidence.summary.hostedPlatformProductionViolations = findings.hostedPlatformFindings.length;
    evidence.summary.fakeLiveClaimsFound = findings.fakeClaimFindings.length;
    evidence.summary.secretLeakFindings = findings.secretFindings.length;
  }
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
}

const result = { status: blockers.length === 0 ? "passed" : "failed", passed: blockers.length === 0, blockers, findings };
console.log(JSON.stringify(result, null, 2));
if (blockers.length > 0) process.exitCode = 1;
