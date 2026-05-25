#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-05-repo-create-event-log.json");
const packageOnly = process.argv.includes("--package-only");

const requiredFiles = [
  "packages/repo-records/package.json",
  "packages/repo-records/tsconfig.json",
  "packages/repo-records/src/index.ts",
  "packages/repo-records/src/repo.ts",
  "packages/repo-records/src/event-log.ts",
  "packages/repo-records/src/signed-record.ts",
  "packages/repo-records/src/repo-records.test.ts",
  "apps/node/package.json",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/services/repo-service.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/routes/node.ts",
  "apps/node/src/routes/events.ts",
  "scripts/golden-path/create-repo-smoke.cjs",
  "scripts/repo-records/check-pr05-repo-records.cjs",
];

const secretPatterns = [
  new RegExp(`${"BEGIN"} ${"PRIVATE"} KEY`),
  new RegExp(`${"BEGIN"} ${"OPENSSH"} ${"PRIVATE"} KEY`),
  /sk-[A-Za-z0-9_-]{10,}/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/,
  /CASTER_QSTORAGE_WRITE_TOKEN=\S+/,
  /CASTER_CLOUD_DEPLOY_TOKEN=\S+/,
  /OPENAI_API_KEY=\S+/,
  /FARCASTER_TOKEN=\S+/,
  /data:image\//i,
];

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
  };
  for (const file of requiredFiles) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full)) {
      findings.missingFiles.push(file);
      continue;
    }
    const text = read(file);
    if (file !== "scripts/repo-records/check-pr05-repo-records.cjs" && /gitlawb|gitlawb:\/\/|did:gitlawb|GITLAWB_|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com/i.test(text)) {
      findings.forbiddenReferenceFindings.push(file);
    }
    if (/"status"\s*:\s*"(live|production|deployed|mapped|replicated|public-alpha)"|status:\s*"(live|production|deployed|mapped|replicated|public-alpha)"/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (file !== "scripts/repo-records/check-pr05-repo-records.cjs") {
      for (const pattern of secretPatterns) {
        if (pattern.test(text)) findings.secretFindings.push({ file, pattern: String(pattern) });
      }
    }
  }
  if (fs.existsSync(evidencePath)) {
    const evidenceText = fs.readFileSync(evidencePath, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.test(evidenceText)) findings.secretFindings.push({ file: "launch/evidence/pr-05-repo-create-event-log.json", pattern: String(pattern) });
    }
  }
  return findings;
}

function loadEvidence() {
  if (!fs.existsSync(evidencePath)) return null;
  return JSON.parse(fs.readFileSync(evidencePath, "utf8"));
}

function writeEvidence(evidence, checkResult) {
  fs.writeFileSync(
    evidencePath,
    `${JSON.stringify(
      {
        ...evidence,
        commandsRun: [...(evidence.commandsRun || []), { command: "node scripts/repo-records/check-pr05-repo-records.cjs", status: checkResult.passed ? "pass" : "fail", note: "PR-05 structural checker" }],
        pr05Checker: checkResult,
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
  const packageJson = JSON.parse(read("packages/repo-records/package.json"));
  if (packageJson.name !== "@gitcaster/repo-records") blockers.push("repo-records package name mismatch");
  if (findings.missingFiles.length) blockers.push(`missing files: ${findings.missingFiles.join(", ")}`);
  if (!packageOnly && !fs.existsSync(path.join(repoRoot, "launch", "evidence", "pr-04-local-alpha-node.json"))) blockers.push("PR-04 evidence missing");
  if (!packageOnly && !evidence) blockers.push("PR-05 evidence missing");
  if (!packageOnly && evidence?.type !== "gitcaster.pr.evidence.v1") blockers.push("PR-05 evidence type mismatch");
  if (!packageOnly && evidence?.pr !== "PR-05") blockers.push("PR-05 evidence PR mismatch");
  if (!packageOnly && evidence?.summary?.repoRecordsPackageFound !== true) blockers.push("repo-records package was not proven");
  if (!packageOnly && evidence?.summary?.validRepoCreateAccepted !== true) blockers.push("valid repo create was not proven");
  if (!packageOnly && evidence?.summary?.invalidSignatureRejected !== true) blockers.push("invalid signature rejection was not proven");
  if (!packageOnly && evidence?.summary?.wrongScopeRejected !== true) blockers.push("wrong scope rejection was not proven");
  if (!packageOnly && evidence?.summary?.replayedNonceRejected !== true) blockers.push("replay rejection was not proven");
  if (!packageOnly && evidence?.summary?.tamperedPayloadRejected !== true) blockers.push("tamper rejection was not proven");
  if (!packageOnly && evidence?.summary?.repoIdUsesGitCasterProtocol !== true) blockers.push("repo id protocol was not proven");
  if (!packageOnly && evidence?.summary?.repoCreatedEventWritten !== true) blockers.push("RepoCreated event was not proven");
  if (!packageOnly && evidence?.summary?.duplicateRepoRejected !== true) blockers.push("duplicate rejection was not proven");
  if (!packageOnly && evidence?.summary?.invalidRepoNameRejected !== true) blockers.push("invalid name rejection was not proven");
  if (findings.forbiddenReferenceFindings.length) blockers.push(`forbidden reference findings: ${findings.forbiddenReferenceFindings.join(", ")}`);
  if (findings.hostedPlatformFindings.length) blockers.push(`hosted platform findings: ${findings.hostedPlatformFindings.join(", ")}`);
  if (findings.secretFindings.length) blockers.push("secret findings present");
  if (findings.fakeClaimFindings.length) blockers.push(`fake claim findings: ${findings.fakeClaimFindings.join(", ")}`);
  const checkResult = {
    status: blockers.length ? "failed" : "passed",
    passed: blockers.length === 0,
    packageOnly,
    checkedAt: new Date().toISOString(),
    blockers,
    findings,
  };
  if (!packageOnly && evidence) writeEvidence(evidence, checkResult);
  console.log(JSON.stringify(checkResult, null, 2));
  if (blockers.length) process.exit(1);
}

main();
