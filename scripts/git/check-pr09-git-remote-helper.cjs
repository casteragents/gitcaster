#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-09-git-remote-helper.json");

const requiredFiles = [
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
  "docs/git-remote-gitcaster.md",
  "scripts/git/check-git-transport-beta.cjs",
  "scripts/git/check-pr09-git-remote-helper.cjs",
  "launch/evidence/pr-09-git-remote-helper.json",
];

const skippedForReferenceInputs = new Set([
  "apps/git-remote-gitcaster/src/git-remote-gitcaster.test.ts",
  "launch/evidence/pr-09-git-remote-helper.json",
  "scripts/git/check-pr09-git-remote-helper.cjs",
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

function addFinding(kind, file, reason) {
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
  const isSkipped = skippedForReferenceInputs.has(file);
  if (!isSkipped && /(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i.test(text)) {
    addFinding("forbiddenReferenceFindings", file, "public GitCaster files must not expose legacy product identity");
  }
  if (!isSkipped && /(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i.test(text)) {
    addFinding("hostedPlatformFindings", file, "hosted platform production dependency mention found");
  }
  if (!isSkipped && /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/.test(text)) {
    addFinding("secretFindings", file, "secret-like content found");
  }
  if (!isSkipped && /(normal git push works|normal git clone works|QStorage verified$|CasterCloud deployed$|is production ready|is live now|multi-node replicated)/i.test(text)) {
    addFinding("fakeClaimFindings", file, "fake transport or deployment claim found");
  }
}

if (fs.existsSync(evidencePath)) {
  const evidence = JSON.parse(read("launch/evidence/pr-09-git-remote-helper.json"));
  if (evidence?.releaseQuality?.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false");
  if (evidence?.summary?.normalGitPushClaimed !== false) blockers.push("normalGitPushClaimed must be false");
  if (evidence?.summary?.normalGitCloneClaimed !== false) blockers.push("normalGitCloneClaimed must be false");
  if (evidence?.summary?.pushLocalRecognizedAsWorkingAlphaPath !== true) blockers.push("PR-08 push-local alpha path was not recognized");
  if (evidence?.summary?.nodeResolverUsesGitCasterEnv !== true) blockers.push("node resolver GitCaster env proof missing");
  if (evidence?.summary?.nodeResolverIgnoresGitlawbEnv !== true) blockers.push("node resolver legacy env ignore proof missing");
  if (evidence?.transportDecision?.packMode?.status !== "blocked") blockers.push("pack mode must be blocked in PR-09");
  if (evidence?.transportDecision?.fetchModeStatus === "alpha-local") blockers.push("fetch mode must not claim alpha-local in PR-09");
} else {
  blockers.push("PR-09 evidence missing");
}

const docs = fs.existsSync(path.join(repoRoot, "docs/git-remote-gitcaster.md")) ? read("docs/git-remote-gitcaster.md") : "";
if (!/gc repo push-local/.test(docs)) blockers.push("docs must identify push-local as the working alpha path");
if (!/PR-22 evidence passes/.test(docs)) blockers.push("docs must defer pack transport to PR-22 evidence");
if (!/No normal `git push` success is claimed in PR-09/.test(docs)) blockers.push("docs must avoid normal git push success claim");

const evidence = fs.existsSync(evidencePath) ? JSON.parse(read("launch/evidence/pr-09-git-remote-helper.json")) : {};
evidence.commandsRun = Array.from(new Set([...(evidence.commandsRun || []), "node scripts/git/check-pr09-git-remote-helper.cjs"]));
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

const result = { status: blockers.length === 0 ? "passed" : "failed", passed: blockers.length === 0, blockers, findings };
console.log(JSON.stringify(result, null, 2));
if (blockers.length > 0) process.exitCode = 1;
