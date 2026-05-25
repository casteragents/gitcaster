#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-07-ref-certificates.json");
const packageOnly = process.argv.includes("--package-only");

const requiredFiles = [
  "packages/ref-consensus/package.json",
  "packages/ref-consensus/tsconfig.json",
  "packages/ref-consensus/src/index.ts",
  "packages/ref-consensus/src/ref-certificate.ts",
  "packages/ref-consensus/src/ref-ledger.ts",
  "packages/ref-consensus/src/ref-policy.ts",
  "packages/ref-consensus/src/ref-adjudicator.ts",
  "packages/ref-consensus/src/verify.ts",
  "packages/ref-consensus/src/conflict-resolution.ts",
  "packages/ref-consensus/src/double-sign-detect.ts",
  "packages/ref-consensus/src/ref-consensus.test.ts",
  "apps/node/package.json",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/routes/refs.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/services/repo-service.ts",
  "scripts/security/test-ref-certificate-redteam.cjs",
  "scripts/ref-consensus/check-pr07-ref-consensus.cjs",
  "launch/evidence/pr-07-ref-certificates.json",
];

const secretPatterns = [
  new RegExp(`${"BEGIN"} ${"PRIVATE"} KEY`),
  new RegExp(`${"BEGIN"} ${"OPENSSH"} ${"PRIVATE"} KEY`),
  /sk-[A-Za-z0-9_-]{10,}/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i,
  /OPENAI_API_KEY=\S+/,
  /CASTER_QSTORAGE_WRITE_TOKEN=\S+/,
  /CASTER_CLOUD_DEPLOY_TOKEN=\S+/,
  /FARCASTER_TOKEN=\S+/,
  /mnemonic/i,
  /seed phrase/i,
  /data:image\//i,
  /[A-Za-z0-9+/]{500,}={0,2}/,
];

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function scanFiles() {
  const findings = {
    missingFiles: [],
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    fakeClaimFindings: [],
    forbiddenStateFindings: [],
  };
  for (const file of requiredFiles) {
    if (!exists(file)) {
      findings.missingFiles.push(file);
      continue;
    }
    const text = read(file);
    const skipSelf = file === "scripts/ref-consensus/check-pr07-ref-consensus.cjs";
    if (!skipSelf && /gitlawb|gitlawb:\/\/|did:gitlawb|GITLAWB_|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com/i.test(text)) {
      findings.forbiddenReferenceFindings.push(file);
    }
    if (!skipSelf && /\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub|IPFS gateways)\b.*\b(production|deploy|deployed|infrastructure|canonical)\b/i.test(text)) {
      findings.hostedPlatformFindings.push(file);
    }
    if (!skipSelf && /"(status)"\s*:\s*"(live|verified|public-alpha|production|deployed|mapped|replicated)"|status:\s*"(live|verified|public-alpha|production|deployed|mapped|replicated)"/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (!skipSelf && /\bpublic consensus\b|\bmulti-node replicated\b|\bproduction consensus\b/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (!skipSelf && /CasterAgents|Caster Punks|caster-punks|casteragents/i.test(text)) {
      findings.forbiddenStateFindings.push(file);
    }
    if (!skipSelf) {
      for (const pattern of secretPatterns) {
        if (pattern.test(text)) findings.secretFindings.push({ file, pattern: String(pattern) });
      }
    }
  }
  return findings;
}

function loadEvidence() {
  if (!exists("launch/evidence/pr-07-ref-certificates.json")) return null;
  return JSON.parse(fs.readFileSync(evidencePath, "utf8"));
}

function appendCheckResult(evidence, checkResult) {
  fs.writeFileSync(
    evidencePath,
    `${JSON.stringify(
      {
        ...evidence,
        commandsRun: [...(evidence.commandsRun || []), { command: "node scripts/ref-consensus/check-pr07-ref-consensus.cjs", status: checkResult.passed ? "pass" : "fail", note: "PR-07 structural checker" }],
        pr07Checker: checkResult,
        passed: checkResult.passed && evidence.passed === true,
        failed: !checkResult.passed || evidence.failed === true,
        blockers: [...(evidence.blockers || []), ...checkResult.blockers],
      },
      null,
      2,
    )}\n`,
  );
}

function main() {
  const findings = scanFiles();
  const evidence = loadEvidence();
  const blockers = [];
  if (findings.missingFiles.length) blockers.push(`missing files: ${findings.missingFiles.join(", ")}`);
  if (!packageOnly && !exists("launch/evidence/pr-06-object-store-qstorage-blockers.json")) blockers.push("PR-06 evidence missing");
  const packageJson = exists("packages/ref-consensus/package.json") ? JSON.parse(read("packages/ref-consensus/package.json")) : {};
  if (packageJson.name !== "@gitcaster/ref-consensus") blockers.push("ref-consensus package name mismatch");
  const nodePackage = exists("apps/node/package.json") ? JSON.parse(read("apps/node/package.json")) : {};
  if (nodePackage.dependencies?.["@gitcaster/ref-consensus"] !== "workspace:*") blockers.push("node package missing ref-consensus dependency");
  if (!packageOnly && !evidence) blockers.push("PR-07 evidence missing");
  if (!packageOnly && evidence?.type !== "gitcaster.pr.evidence.v1") blockers.push("PR-07 evidence type mismatch");
  if (!packageOnly && evidence?.pr !== "PR-07") blockers.push("PR-07 evidence PR mismatch");
  if (!packageOnly && evidence?.summary?.refConsensusPackageFound !== true) blockers.push("ref-consensus package was not proven");
  if (!packageOnly && evidence?.summary?.refConsensusBuildPassed !== true) blockers.push("ref-consensus build was not proven");
  if (!packageOnly && evidence?.summary?.refConsensusTestsPassed !== true) blockers.push("ref-consensus tests were not proven");
  if (!packageOnly && evidence?.summary?.nodeBuildPassed !== true) blockers.push("node build was not proven");
  if (!packageOnly && evidence?.summary?.firstMainCertCreated !== true) blockers.push("first main cert was not proven");
  if (!packageOnly && evidence?.summary?.secondMainCertCreated !== true) blockers.push("second main cert was not proven");
  if (!packageOnly && evidence?.summary?.wrongFromRejected !== true) blockers.push("wrong from rejection was not proven");
  if (!packageOnly && evidence?.summary?.forcePushRejected !== true) blockers.push("force-push rejection was not proven");
  if (!packageOnly && evidence?.summary?.branchDeletionRejected !== true) blockers.push("branch deletion rejection was not proven");
  if (!packageOnly && evidence?.summary?.protectedBranchPolicyChecked !== true) blockers.push("protected branch policy was not proven");
  if (!packageOnly && evidence?.summary?.actorSignatureChecked !== true) blockers.push("actor signature check was not proven");
  if (!packageOnly && evidence?.summary?.nodeSignatureIssuedAfterActorVerification !== true) blockers.push("node signature issuance was not proven");
  if (!packageOnly && evidence?.summary?.nonceReplayRejected !== true) blockers.push("nonce replay rejection was not proven");
  if (!packageOnly && evidence?.summary?.timestampSkewRejected !== true) blockers.push("timestamp skew rejection was not proven");
  if (!packageOnly && evidence?.summary?.ledgerAppendOnly !== true) blockers.push("append-only ledger was not proven");
  if (!packageOnly && evidence?.summary?.doubleSignDetected !== true) blockers.push("double-sign detection was not proven");
  if (!packageOnly && evidence?.summary?.conflictEvidenceWritten !== true) blockers.push("conflict evidence was not proven");
  if (!packageOnly && evidence?.summary?.repoRefsRouteShowsLedger !== true) blockers.push("repo refs route ledger output was not proven");
  if (!packageOnly && evidence?.summary?.publicConsensusClaimed !== false) blockers.push("public consensus was claimed");
  if (!packageOnly && evidence?.summary?.multiNodeReplicationClaimed !== false) blockers.push("multi-node replication was claimed");
  if (!packageOnly && evidence?.releaseQuality?.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false");
  if (!packageOnly && evidence?.releaseQuality?.releaseLevel !== "alpha-local") blockers.push("releaseQuality releaseLevel must be alpha-local");
  if (!packageOnly && evidence?.refCertificate?.status !== "alpha-local") blockers.push("ref certificate evidence is not alpha-local");
  if (!packageOnly && !String(evidence?.refLedger?.currentHead || "").startsWith("sha256:")) blockers.push("current head is not sha256-prefixed");
  if (findings.forbiddenReferenceFindings.length) blockers.push(`forbidden reference findings: ${findings.forbiddenReferenceFindings.join(", ")}`);
  if (findings.hostedPlatformFindings.length) blockers.push(`hosted platform findings: ${findings.hostedPlatformFindings.join(", ")}`);
  if (findings.secretFindings.length) blockers.push("secret findings present");
  if (findings.fakeClaimFindings.length) blockers.push(`fake claim findings: ${findings.fakeClaimFindings.join(", ")}`);
  if (findings.forbiddenStateFindings.length) blockers.push(`forbidden state findings: ${findings.forbiddenStateFindings.join(", ")}`);

  const checkResult = {
    status: blockers.length ? "failed" : "passed",
    passed: blockers.length === 0,
    packageOnly,
    checkedAt: new Date().toISOString(),
    blockers,
    findings,
  };
  if (!packageOnly && evidence) appendCheckResult(evidence, checkResult);
  console.log(JSON.stringify(checkResult, null, 2));
  if (blockers.length) process.exit(1);
}

main();
