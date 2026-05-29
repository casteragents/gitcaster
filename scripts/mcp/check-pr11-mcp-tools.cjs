#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-11-mcp-tools.json");
const requiredFiles = [
  "apps/mcp/package.json",
  "apps/mcp/tsconfig.json",
  "apps/mcp/src/server.ts",
  "apps/mcp/src/tool-registry.ts",
  "apps/mcp/src/json-rpc.ts",
  "apps/mcp/src/node-client.ts",
  "apps/mcp/src/blockers.ts",
  "apps/mcp/src/schemas.ts",
  "apps/mcp/src/mcp.test.ts",
  "apps/mcp/src/tools/identity.ts",
  "apps/mcp/src/tools/node.ts",
  "apps/mcp/src/tools/repo.ts",
  "apps/mcp/src/tools/refs.ts",
  "apps/mcp/src/tools/issues.ts",
  "apps/mcp/src/tools/prs.ts",
  "apps/mcp/src/tools/object.ts",
  "apps/mcp/src/tools/qstorage.ts",
  "apps/mcp/src/tools/castercloud.ts",
  "apps/mcp/src/tools/ecosystem.ts",
  "apps/mcp/src/tools/miniapp.ts",
  "apps/mcp/src/tools/domain.ts",
  "apps/mcp/src/tools/token.ts",
  "apps/mcp/src/tools/security.ts",
  "apps/mcp/src/tools/evidence.ts",
  "apps/cli/src/commands/mcp.ts",
  "apps/cli/src/index.ts",
  "docs/mcp.md",
  "docs/agent-skills.md",
  "apps/web/app/open-source/mcp-source/page.tsx",
  "apps/web/public/gitcaster-mcp-source.md",
  "docs-source/developer-layers/mcp-source.md",
  "examples/mcp/local-tool-plan.example.json",
  "scripts/mcp/check-mcp-beta-tools.cjs",
  "scripts/mcp/check-pr11-mcp-tools.cjs",
  "launch/evidence/pr-11-mcp-tools.json",
];
const skipContentScan = new Set([
  "apps/mcp/src/mcp.test.ts",
  "scripts/mcp/check-mcp-beta-tools.cjs",
  "scripts/mcp/check-pr11-mcp-tools.cjs",
  "launch/evidence/pr-11-mcp-tools.json",
]);
const blockers = [];
const findings = {
  missingFiles: [],
  forbiddenReferenceFindings: [],
  hostedPlatformFindings: [],
  secretFindings: [],
  fakeClaimFindings: [],
};

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function add(kind, file, reason) {
  findings[kind].push({ file, reason });
  blockers.push(`${file}: ${reason}`);
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    findings.missingFiles.push(file);
    blockers.push(`missing file: ${file}`);
  }
}

for (const file of requiredFiles.filter((item) => fs.existsSync(path.join(repoRoot, item)))) {
  const text = read(file);
  const skipped = skipContentScan.has(file);
  if (!skipped && /(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i.test(text)) {
    add("forbiddenReferenceFindings", file, "legacy public identity string found");
  }
  if (!skipped && /(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i.test(text)) {
    add("hostedPlatformFindings", file, "hosted platform production dependency mention found");
  }
  if (!skipped && /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/.test(text)) {
    add("secretFindings", file, "secret-like content found");
  }
  if (!skipped && /(QStorage verified|CasterCloud deployed|domain mapped|normal git transport works|public MCP gateway ready|multi-node replicated|is production ready|is live now)/i.test(text)) {
    add("fakeClaimFindings", file, "fake tool or production claim found");
  }
}

let evidence = {};
if (!fs.existsSync(evidencePath)) {
  blockers.push("PR-11 evidence missing");
} else {
  evidence = JSON.parse(read("launch/evidence/pr-11-mcp-tools.json"));
  if (evidence.pr !== "PR-11") blockers.push("evidence must identify PR-11");
  if (evidence.summary?.requiredToolsFound !== 31) blockers.push("requiredToolsFound must be 31");
  if (Array.isArray(evidence.summary?.missingTools) && evidence.summary.missingTools.length !== 0) blockers.push("missingTools must be empty");
  for (const key of [
    "mcpPackageFound",
    "mcpBuildPassed",
    "mcpTestsPassed",
    "cliBuildPassed",
    "jsonRpcInitializePassed",
    "toolsListPassed",
    "nodeResolverUsesGitCasterEnv",
    "nodeResolverIgnoresGitlawbEnv",
    "nodeDependentToolsBlockWithoutNode",
    "mutatingToolsBlockWithoutSigningIdentity",
    "blockedToolsReturnStructuredBlockers",
    "identityShowDoesNotReturnPrivateKey",
    "tokenInfoUsesCaster",
    "docsUseGitCasterConfig",
    "publicAlphaSourceReleased",
    "publicDocsFound",
    "localToolPlanFixtureFound",
  ]) {
    if (evidence.summary?.[key] !== true) blockers.push(`evidence summary ${key} must be true`);
  }
  if (evidence.summary?.tokenInfoClaimsLiveUtility !== false) blockers.push("token info must not claim active utility");
  if (evidence.summary?.qstorageVerifyStatus !== "requires-endpoint") blockers.push("qstorageVerifyStatus must be requires-endpoint");
  if (evidence.summary?.castercloudVerifyStatus !== "requires-endpoint") blockers.push("castercloudVerifyStatus must be requires-endpoint");
  if (evidence.summary?.domainStatus !== "requires-registry") blockers.push("domainStatus must be requires-registry");
  if (evidence.summary?.pr10EvidenceFound === true && !fs.existsSync(path.join(repoRoot, "launch/evidence/pr-10-issues-prs.json"))) blockers.push("pr10EvidenceFound cannot be true without PR-10 evidence");
  if (evidence.releaseQuality?.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false");
  if (evidence.mcp?.publicNetworkClaimed !== false || evidence.mcp?.productionGatewayClaimed !== false) blockers.push("MCP public network and production gateway claims must be false");
  if (evidence.token?.stakingLiveClaimed !== false || evidence.token?.rewardsPaidClaimed !== false || evidence.token?.governanceLiveClaimed !== false) blockers.push("token active utility claims must be false");
}

evidence.commandsRun = Array.from(new Set([...(evidence.commandsRun || []), "node scripts/mcp/check-pr11-mcp-tools.cjs"]));
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
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
const result = { status: blockers.length === 0 ? "passed" : "failed", passed: blockers.length === 0, blockers, findings };
console.log(JSON.stringify(result, null, 2));
if (blockers.length > 0) process.exitCode = 1;
