#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-08-push-local.json");

const requiredFiles = [
  "apps/node/src/routes/push-local.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/services/push-local-service.ts",
  "apps/node/src/services/repo-service.ts",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/services/secret-scan-lite.ts",
  "apps/cli/package.json",
  "apps/cli/tsconfig.json",
  "apps/cli/src/index.ts",
  "apps/cli/src/commands/push-local.ts",
  "scripts/golden-path/create-demo-fixture-app.cjs",
  "scripts/golden-path/push-local-smoke.cjs",
  "scripts/push-local/check-pr08-push-local.cjs",
  "launch/evidence/pr-08-push-local.json",
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
  /seed phrase/i,
  /mnemonic/i,
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
    const skipSelf = file === "scripts/push-local/check-pr08-push-local.cjs";
    if (!skipSelf && /gitlawb|gitlawb:\/\/|did:gitlawb|GITLAWB_|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com/i.test(text)) {
      findings.forbiddenReferenceFindings.push(file);
    }
    if (!skipSelf && /\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub|IPFS gateways)\b.*\b(production|deploy|deployed|infrastructure|canonical)\b/i.test(text)) {
      findings.hostedPlatformFindings.push(file);
    }
    if (!skipSelf && /"(status)"\s*:\s*"(live|verified|public-alpha|production|deployed|mapped|replicated)"|status:\s*"(live|verified|public-alpha|production|deployed|mapped|replicated)"/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (!skipSelf && /\bnormal git push works\b|\bpublic network push\b|\bmulti-node consensus\b|\bQStorage verified\b|\bCasterCloud deployment\b/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (!skipSelf && /CasterAgents|Caster Punks|caster-punks|casteragents/i.test(text)) {
      findings.forbiddenStateFindings.push(file);
    }
    if (!["scripts/push-local/check-pr08-push-local.cjs", "scripts/golden-path/push-local-smoke.cjs", "apps/node/src/services/secret-scan-lite.ts"].includes(file)) {
      for (const pattern of secretPatterns) {
        if (pattern.test(text)) findings.secretFindings.push({ file, pattern: String(pattern) });
      }
    }
  }
  return findings;
}

function loadEvidence() {
  if (!exists("launch/evidence/pr-08-push-local.json")) return null;
  return JSON.parse(fs.readFileSync(evidencePath, "utf8"));
}

function evidenceSecretFindings() {
  if (!fs.existsSync(evidencePath)) return [];
  const text = fs.readFileSync(evidencePath, "utf8");
  const findings = [];
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) findings.push({ file: "launch/evidence/pr-08-push-local.json", pattern: String(pattern) });
  }
  return findings;
}

function appendCheckResult(evidence, checkResult) {
  fs.writeFileSync(
    evidencePath,
    `${JSON.stringify(
      {
        ...evidence,
        commandsRun: [...(evidence.commandsRun || []), { command: "node scripts/push-local/check-pr08-push-local.cjs", status: checkResult.passed ? "pass" : "fail", note: "PR-08 structural checker" }],
        pr08Checker: checkResult,
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
  findings.secretFindings.push(...evidenceSecretFindings());
  const evidence = loadEvidence();
  const blockers = [];
  if (findings.missingFiles.length) blockers.push(`missing files: ${findings.missingFiles.join(", ")}`);
  if (!exists("launch/evidence/pr-07-ref-certificates.json")) blockers.push("PR-07 evidence missing");
  const cliPackage = exists("apps/cli/package.json") ? JSON.parse(read("apps/cli/package.json")) : {};
  if (cliPackage.name !== "@gitcaster/cli") blockers.push("cli package missing or misnamed");
  if (!exists("apps/cli/dist/index.js")) blockers.push("cli dist missing; run pnpm --filter @gitcaster/cli build");
  if (!exists("apps/node/dist/server.js")) blockers.push("node dist missing; run pnpm --filter @gitcaster/node build");
  if (!evidence) blockers.push("PR-08 evidence missing");
  if (evidence?.type !== "gitcaster.pr.evidence.v1") blockers.push("PR-08 evidence type mismatch");
  if (evidence?.pr !== "PR-08") blockers.push("PR-08 evidence PR mismatch");
  const summary = evidence?.summary || {};
  const requiredTrue = [
    "nodeBuildPassed",
    "cliBuildPassed",
    "fixtureAppCreated",
    "serverStarted",
    "identityRegistered",
    "repoCreated",
    "unsignedPushRejected",
    "invalidSignatureRejected",
    "wrongScopeRejected",
    "replayedNonceRejected",
    "tamperedPayloadRejected",
    "validPushAccepted",
    "localPathSafetyChecked",
    "deniedPathRejected",
    "secretScanPassedForSafeFixture",
    "secretScanBlockedUnsafeFixture",
    "objectManifestCreated",
    "rootHashDeterministic",
    "refCertificateIssued",
    "mainRefUpdated",
    "commitPushedEventWritten",
    "refCertificateIssuedEventWritten",
    "repoTreeUpdated",
    "repoProofsUpdated",
  ];
  for (const key of requiredTrue) {
    if (summary[key] !== true) blockers.push(`${key} was not proven`);
  }
  if (summary.objectManifestStatus !== "alpha-local") blockers.push("object manifest status is not alpha-local");
  if (summary.refCertificateType !== "gitcaster.ref.update.v1") blockers.push("ref certificate type mismatch");
  if (summary.qstorageStatus !== "requires-endpoint") blockers.push("QStorage status mismatch");
  if (summary.castercloudStatus !== "requires-endpoint") blockers.push("CasterCloud status mismatch");
  if (summary.normalGitPushClaimed !== false) blockers.push("normal git push was claimed");
  if (summary.publicNetworkClaimed !== false) blockers.push("public network was claimed");
  if (summary.multiNodeReplicationClaimed !== false) blockers.push("multi-node replication was claimed");
  if (evidence?.pushLocal?.status !== "alpha-local") blockers.push("pushLocal status is not alpha-local");
  if (!String(evidence?.pushLocal?.to || "").startsWith("sha256:")) blockers.push("pushLocal head is not sha256-prefixed");
  if (evidence?.objectManifest?.status !== "alpha-local") blockers.push("object manifest evidence is not alpha-local");
  if (evidence?.refCertificate?.type !== "gitcaster.ref.update.v1") blockers.push("ref certificate evidence type mismatch");
  if (evidence?.externalServices?.qstorage?.verified !== false) blockers.push("QStorage was verified without proof");
  if (evidence?.externalServices?.castercloud?.verified !== false) blockers.push("CasterCloud was verified without proof");
  if (evidence?.releaseQuality?.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false");
  if (evidence?.secretScan?.secretValuesStored !== false) blockers.push("secret scan stored values");
  if (findings.forbiddenReferenceFindings.length) blockers.push(`forbidden reference findings: ${findings.forbiddenReferenceFindings.join(", ")}`);
  if (findings.hostedPlatformFindings.length) blockers.push(`hosted platform findings: ${findings.hostedPlatformFindings.join(", ")}`);
  if (findings.secretFindings.length) blockers.push("secret findings present");
  if (findings.fakeClaimFindings.length) blockers.push(`fake claim findings: ${findings.fakeClaimFindings.join(", ")}`);
  if (findings.forbiddenStateFindings.length) blockers.push(`forbidden state findings: ${findings.forbiddenStateFindings.join(", ")}`);
  const checkResult = {
    status: blockers.length ? "failed" : "passed",
    passed: blockers.length === 0,
    checkedAt: new Date().toISOString(),
    blockers,
    findings,
  };
  if (evidence) appendCheckResult(evidence, checkResult);
  console.log(JSON.stringify(checkResult, null, 2));
  if (blockers.length) process.exit(1);
}

main();
