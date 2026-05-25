#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-06-object-store-qstorage-blockers.json");
const packageOnly = process.argv.includes("--package-only");

const requiredFiles = [
  "packages/object-store/package.json",
  "packages/object-store/tsconfig.json",
  "packages/object-store/src/index.ts",
  "packages/object-store/src/driver.ts",
  "packages/object-store/src/local-alpha-driver.ts",
  "packages/object-store/src/qstorage-driver.ts",
  "packages/object-store/src/castercloud-driver.ts",
  "packages/object-store/src/manifest.ts",
  "packages/object-store/src/proof.ts",
  "packages/object-store/src/mime.ts",
  "packages/object-store/src/checksums.ts",
  "packages/object-store/src/object-store.test.ts",
  "apps/node/package.json",
  "apps/node/src/routes/qstorage.ts",
  "apps/node/src/routes/castercloud.ts",
  "apps/node/src/services/repo-service.ts",
  "scripts/object-store/test-object-store-honesty.cjs",
  "scripts/object-store/check-pr06-object-store.cjs",
  "launch/evidence/pr-06-object-store-qstorage-blockers.json",
];

const sourceFiles = requiredFiles.filter((file) => file !== "launch/evidence/pr-06-object-store-qstorage-blockers.json");

const secretPatterns = [
  new RegExp(`${"BEGIN"} ${"PRIVATE"} KEY`),
  new RegExp(`${"BEGIN"} ${"OPENSSH"} ${"PRIVATE"} KEY`),
  /sk-[A-Za-z0-9_-]{10,}/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i,
  /OPENAI_API_KEY=\S+/,
  /CASTER_QSTORAGE_WRITE_TOKEN=\S+/,
  /CASTER_CLOUD_DEPLOY_TOKEN=\S+/,
];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
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
    const skipSelf = file === "scripts/object-store/check-pr06-object-store.cjs";
    if (!skipSelf && /gitlawb|gitlawb:\/\/|did:gitlawb|GITLAWB_|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com/i.test(text)) {
      findings.forbiddenReferenceFindings.push(file);
    }
    if (!skipSelf && /\b(Vercel|Supabase|Fly|Render|Netlify|Pinata|Filecoin|Arweave|IPFS)\b.*\b(production|deploy|deployed|hosting|path)\b/i.test(text)) {
      findings.hostedPlatformFindings.push(file);
    }
    if (!skipSelf && /"(status)"\s*:\s*"(live|production|deployed|mapped|replicated|public-alpha)"|status:\s*"(live|production|deployed|mapped|replicated|public-alpha)"/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (!skipSelf && /\bverified\s*:\s*true\b|"\bverified\b"\s*:\s*true|\bsigned\s*:\s*true\b|"\bsigned\b"\s*:\s*true/i.test(text)) {
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
  if (!exists("launch/evidence/pr-06-object-store-qstorage-blockers.json")) return null;
  return JSON.parse(fs.readFileSync(evidencePath, "utf8"));
}

function evidenceSecretFindings() {
  if (!fs.existsSync(evidencePath)) return [];
  const text = fs.readFileSync(evidencePath, "utf8");
  const findings = [];
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) findings.push({ file: "launch/evidence/pr-06-object-store-qstorage-blockers.json", pattern: String(pattern) });
  }
  return findings;
}

function appendCheckResult(evidence, checkResult) {
  fs.writeFileSync(
    evidencePath,
    `${JSON.stringify(
      {
        ...evidence,
        commandsRun: [...(evidence.commandsRun || []), { command: "node scripts/object-store/check-pr06-object-store.cjs", status: checkResult.passed ? "pass" : "fail", note: "PR-06 structural checker" }],
        pr06Checker: checkResult,
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
  if (!packageOnly && !exists("launch/evidence/pr-05-repo-create-event-log.json")) blockers.push("PR-05 evidence missing");
  const packageJson = exists("packages/object-store/package.json") ? JSON.parse(read("packages/object-store/package.json")) : {};
  if (packageJson.name !== "@gitcaster/object-store") blockers.push("object-store package name mismatch");
  const nodePackage = exists("apps/node/package.json") ? JSON.parse(read("apps/node/package.json")) : {};
  if (nodePackage.dependencies?.["@gitcaster/object-store"] !== "workspace:*") blockers.push("node package missing object-store dependency");
  if (!packageOnly && !evidence) blockers.push("PR-06 evidence missing");
  if (!packageOnly && evidence?.type !== "gitcaster.pr.evidence.v1") blockers.push("PR-06 evidence type mismatch");
  if (!packageOnly && evidence?.pr !== "PR-06") blockers.push("PR-06 evidence PR mismatch");
  if (!packageOnly && evidence?.summary?.objectStorePackageFound !== true) blockers.push("object-store package was not proven");
  if (!packageOnly && evidence?.summary?.localAlphaDriverPassed !== true) blockers.push("local-alpha driver was not proven");
  if (!packageOnly && evidence?.summary?.objectManifestCreated !== true) blockers.push("object manifest was not proven");
  if (!packageOnly && evidence?.summary?.objectHashesSha256Prefixed !== true) blockers.push("sha256 object hashes were not proven");
  if (!packageOnly && evidence?.summary?.rootHashDeterministic !== true) blockers.push("deterministic root hash was not proven");
  if (!packageOnly && evidence?.summary?.ignoredPathsExcluded !== true) blockers.push("ignored path exclusion was not proven");
  if (!packageOnly && evidence?.summary?.qstorageMissingEnvBlocked !== true) blockers.push("QStorage missing env blocker was not proven");
  if (!packageOnly && evidence?.summary?.qstorageTokenRedacted !== true) blockers.push("QStorage token redaction was not proven");
  if (!packageOnly && evidence?.summary?.qstorageVerifiedWithoutProof !== false) blockers.push("QStorage verified without proof");
  if (!packageOnly && evidence?.summary?.castercloudMissingEnvBlocked !== true) blockers.push("CasterCloud missing env blocker was not proven");
  if (!packageOnly && evidence?.summary?.castercloudTokenRedacted !== true) blockers.push("CasterCloud token redaction was not proven");
  if (!packageOnly && evidence?.summary?.castercloudDeployedWithoutProof !== false) blockers.push("CasterCloud deployed without proof");
  if (!packageOnly && evidence?.summary?.castercloudVerifiedWithoutProof !== false) blockers.push("CasterCloud verified without proof");
  if (!packageOnly && evidence?.summary?.unsignedDeploymentManifest !== true) blockers.push("unsigned deployment manifest was not proven");
  if (!packageOnly && evidence?.objectStore?.status !== "alpha-local") blockers.push("object-store evidence is not alpha-local");
  if (!packageOnly && !String(evidence?.objectStore?.rootHash || "").startsWith("sha256:")) blockers.push("evidence root hash is not sha256-prefixed");
  if (!packageOnly && evidence?.castercloud?.deploymentManifest?.signed !== false) blockers.push("deployment manifest is not explicitly unsigned");
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
    checkedFiles: sourceFiles,
    findings,
  };

  if (!packageOnly && evidence) appendCheckResult(evidence, checkResult);
  console.log(JSON.stringify(checkResult, null, 2));
  if (blockers.length) process.exit(1);
}

main();
