#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-10-issues-prs.json");
const requiredFiles = [
  "packages/repo-records/src/issue.ts",
  "packages/repo-records/src/pr.ts",
  "packages/repo-records/src/review.ts",
  "packages/repo-records/src/repo-records.test.ts",
  "packages/repo-records/src/index.ts",
  "apps/node/src/services/issue-service.ts",
  "apps/node/src/services/pr-service.ts",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/routes/issues.ts",
  "apps/node/src/routes/prs.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/routes/events.ts",
  "apps/cli/src/commands/issue.ts",
  "apps/cli/src/commands/pr.ts",
  "apps/cli/src/index.ts",
  "scripts/golden-path/issue-pr-smoke.cjs",
  "scripts/repo-records/check-pr10-issues-prs.cjs",
  "launch/evidence/pr-10-issues-prs.json",
];

const skipReferenceScan = new Set([
  "packages/repo-records/src/repo-records.test.ts",
  "scripts/repo-records/check-pr10-issues-prs.cjs",
  "launch/evidence/pr-10-issues-prs.json",
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
  const skipped = skipReferenceScan.has(file);
  if (!skipped && /(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i.test(text)) {
    add("forbiddenReferenceFindings", file, "legacy public identity string found");
  }
  if (!skipped && /(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i.test(text)) {
    add("hostedPlatformFindings", file, "hosted platform production dependency mention found");
  }
  if (/(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/.test(text)) {
    if (!file.endsWith("check-pr10-issues-prs.cjs")) add("secretFindings", file, "secret-like content found");
  }
  if (!skipped && /(public network collaboration|QStorage verified|CasterCloud deployed|normal git push works|multi-node replicated|is production ready|is live now)/i.test(text)) {
    add("fakeClaimFindings", file, "fake collaboration, transport, or deployment claim found");
  }
}

let evidence = {};
if (!fs.existsSync(evidencePath)) {
  blockers.push("PR-10 evidence missing");
} else {
  evidence = JSON.parse(read("launch/evidence/pr-10-issues-prs.json"));
  const checks = [
    "repoRecordsBuildPassed",
    "repoRecordsTestsPassed",
    "nodeBuildPassed",
    "cliBuildPassed",
    "serverStarted",
    "identityRegistered",
    "repoCreated",
    "issueCreateUnsignedRejected",
    "issueCreateWrongScopeRejected",
    "issueCreateReplayRejected",
    "issueCreateTamperRejected",
    "validIssueCreated",
    "issueRecordSigned",
    "issueOpenedEventWritten",
    "issueListed",
    "issueUpdated",
    "issueUpdatedEventWritten",
    "prCreateUnsignedRejected",
    "prCreateWrongScopeRejected",
    "prCreateReplayRejected",
    "prCreateTamperRejected",
    "validPrCreated",
    "prRecordSigned",
    "prOpenedEventWritten",
    "prListed",
    "prViewed",
    "reviewCreated",
    "reviewRecordSigned",
    "prReviewedEventWritten",
    "mergeAttempted",
    "mergeSucceededOrBlockedHonestly",
    "prMergedEventWrittenIfMerged",
    "refsChangedOnlyIfProven",
    "eventLogIncludesCollaborationEvents",
    "pr09EvidenceFound",
  ];
  for (const key of checks) {
    if (evidence.summary?.[key] !== true) blockers.push(`evidence summary ${key} must be true`);
  }
  if (evidence.summary?.qstorageStatus !== "requires-endpoint") blockers.push("qstorageStatus must be requires-endpoint");
  if (evidence.summary?.castercloudStatus !== "requires-endpoint") blockers.push("castercloudStatus must be requires-endpoint");
  if (evidence.summary?.normalGitPushClaimed !== false) blockers.push("normalGitPushClaimed must be false");
  if (evidence.summary?.publicNetworkClaimed !== false) blockers.push("publicNetworkClaimed must be false");
  if (evidence.summary?.multiNodeReplicationClaimed !== false) blockers.push("multiNodeReplicationClaimed must be false");
  if (evidence.releaseQuality?.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false");
  if (evidence.issues?.status !== "alpha-local") blockers.push("issues.status must be alpha-local");
  if (evidence.pullRequests?.status !== "alpha-local") blockers.push("pullRequests.status must be alpha-local");
  if (evidence.pullRequests?.refsChanged !== false) blockers.push("record-only merge must not change refs");
}

evidence.commandsRun = Array.from(new Set([...(evidence.commandsRun || []), "node scripts/repo-records/check-pr10-issues-prs.cjs"]));
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
