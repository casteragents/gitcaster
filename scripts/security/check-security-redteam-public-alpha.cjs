#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch", "evidence", "security-redteam-public-hardening-source.json");

const requiredFiles = [
  "scripts/security/run-beta-gate.cjs",
  "scripts/security/check-security-redteam-public-alpha.cjs",
  "scripts/security/redteam/run-redteam-suite.cjs",
  "scripts/security/redteam/check-crypto-invariants.cjs",
  "scripts/security/redteam/check-identity-replay-attacks.cjs",
  "scripts/security/redteam/check-capability-abuse.cjs",
  "scripts/security/redteam/check-deployment-proof-abuse.cjs",
  "scripts/security/redteam/check-pr27-redteam.cjs",
  "docs/security/redteam-plan.md",
  "docs/security/crypto-audit-rehearsal.md",
  "apps/web/app/open-source/security-redteam/page.tsx",
  "apps/web/public/gitcaster-security-redteam.md",
  "docs-source/developer-layers/security-redteam.md",
  "examples/security/redteam-hardening-plan.example.json",
  "launch/evidence/pr-17-castercloud-qstorage-pipeline.json"
];

const requiredArtifacts = [
  "launch/evidence/pr-18-security-gate.json",
  "launch/evidence/pr-27-security-redteam-crypto-audit.json",
  "launch/evidence/redteam-suite-result.json",
  "launch/evidence/redteam-crypto-invariants.json",
  "launch/evidence/redteam-identity-replay-attacks.json",
  "launch/evidence/redteam-capability-abuse.json",
  "launch/evidence/redteam-deployment-proof-abuse.json",
  "launch/evidence/redteam-findings.json",
  "launch/evidence/redteam-remediation-plan.json"
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function readJson(rel, fallback = {}) {
  try {
    return JSON.parse(read(rel));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function run(command, args) {
  const result = cp.spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 180000,
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    command: [command, ...args].join(" "),
    exitCode: result.status,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    stdout: String(result.stdout || "").split(/\r?\n/).filter(Boolean).slice(-8),
    stderr: String(result.stderr || "").split(/\r?\n/).filter(Boolean).slice(-8)
  };
}

function scanPublicFiles(files) {
  const findings = [];
  for (const file of files.filter(exists)) {
    const isSecurityScript = file.startsWith("scripts/security/");
    const text = read(file);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const regexLiteralDetector = isSecurityScript && /\/.*(?:production-ready|unhackable|bulletproof|fully secure|security audit complete|externally audited|QStorage verified|CasterCloud deployed|CasterCloud verified|public nodes online|multi-node replicated|staking live|rewards paid|governance live|\.caster mapped|Authorization:|PRIVATE KEY|OPENAI_API_KEY|CASTER_QSTORAGE_WRITE_TOKEN|CASTER_CLOUD_DEPLOY_TOKEN|FARCASTER_TOKEN|mnemonic|seed phrase).*\/[a-z]*/i.test(line);
      const detectorContext = regexLiteralDetector || /regex|pattern|secretPatterns|description|finding|rule|detector|scan|fix:|forbidden|downgrade|unsupported/i.test(line);
      const negative = detectorContext || /\b(no|not|without|blocked|requires|required|false|cannot|must not|never|rejected|does not|do not|downgraded|outside|guardrail)\b/i.test(line);
      if (!detectorContext && /BEGIN (?:OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|mnemonic|seed phrase/i.test(line)) {
        findings.push({ file, line: index + 1, rule: "secret-like-content" });
      }
      if (!negative && /\b(production-ready|security audit complete|externally audited|unhackable|bulletproof|fully secure|QStorage verified|CasterCloud deployed|\.caster mapped|public nodes online|multi-node replicated)\b/i.test(line)) {
        findings.push({ file, line: index + 1, rule: "unsupported-security-or-live-claim" });
      }
    });
  }
  return findings;
}

function main() {
  const commandResults = [
    run("node", ["scripts/security/redteam/run-redteam-suite.cjs"]),
    run("node", ["scripts/security/redteam/check-pr27-redteam.cjs"]),
    run("node", ["scripts/security/run-beta-gate.cjs"])
  ];

  const missingFiles = requiredFiles.filter((file) => !exists(file));
  const missingArtifacts = requiredArtifacts.filter((file) => !exists(file));
  const pr18 = readJson("launch/evidence/pr-18-security-gate.json");
  const pr27 = readJson("launch/evidence/pr-27-security-redteam-crypto-audit.json");
  const suite = readJson("launch/evidence/redteam-suite-result.json");
  const capability = readJson("launch/evidence/redteam-capability-abuse.json");
  const deployment = readJson("launch/evidence/redteam-deployment-proof-abuse.json");
  const pr17 = readJson("launch/evidence/pr-17-castercloud-qstorage-pipeline.json");
  const publicScanFindings = scanPublicFiles(requiredFiles);

  const blockers = [];
  blockers.push(...missingFiles.map((file) => `missing file: ${file}`));
  blockers.push(...missingArtifacts.map((file) => `missing artifact: ${file}`));
  for (const result of commandResults) {
    if (result.exitCode !== 0) blockers.push(`command failed: ${result.command}`);
    if (result.timedOut) blockers.push(`command timed out: ${result.command}`);
  }
  if (suite.status !== "passed") blockers.push("redteam suite must pass local deterministic checks");
  if (pr27.status !== "passed") blockers.push("PR-27 redteam rehearsal evidence must pass");
  if (pr18.status !== "passed") blockers.push("PR-18 beta security gate must pass after blocked evidence is recorded");
  if (capability.summary?.capabilityEscalationsFound !== 0) blockers.push("capability redteam found escalation findings");
  if (deployment.summary?.fakeProofAccepted !== false) blockers.push("deployment proof abuse checker must reject fake proof");
  if (pr17.status !== "blocked_external" || pr17.deployedClaimed !== false || pr17.qstoragePublishedClaimed !== false || pr17.castercloudDeployedClaimed !== false) {
    blockers.push("PR-17 blocked evidence must avoid deploy, QStorage, or CasterCloud live claims");
  }
  blockers.push(...publicScanFindings.map((finding) => `${finding.file}:${finding.line} ${finding.rule}`));

  const evidence = {
    type: "gitcaster.public-release.evidence.v1",
    slice: "security-redteam-public-hardening",
    status: blockers.length ? "failed" : "passed",
    createdAt: new Date().toISOString(),
    filesChanged: requiredFiles,
    commandsRun: commandResults.map((result) => result.command),
    summary: {
      securityScriptsPublished: missingFiles.length === 0,
      redteamSuiteStatus: suite.status || "missing",
      pr18SecurityGateStatus: pr18.status || "missing",
      pr27RedteamStatus: pr27.status || "missing",
      secretScanStatus: pr18.checks?.["secret-scan"]?.status || "missing",
      fakeLiveClaimCheckStatus: pr18.checks?.["no-fake-live-claims"]?.status || "missing",
      hostedPlatformCheckStatus: pr18.checks?.["no-hosted-platform-production"]?.status || "missing",
      signedMutationCheckStatus: pr18.checks?.["signed-mutation-enforcement"]?.status || "missing",
      objectStoreHonestyStatus: pr18.checks?.["object-store-honesty"]?.status || "missing",
      capabilityEscalationsFound: capability.summary?.capabilityEscalationsFound ?? null,
      fakeProofAccepted: deployment.summary?.fakeProofAccepted ?? null,
      hostedPlatformProofAccepted: deployment.summary?.hostedPlatformProofAccepted ?? null,
      placeholderProofAccepted: deployment.summary?.placeholderProofAccepted ?? null,
      dryRunAcceptedAsLiveProof: deployment.summary?.dryRunAcceptedAsLiveProof ?? null,
      externalAuditRequired: true,
      securityAuditCompleteClaimed: false,
      productionSecurityReadinessClaimed: false,
      canShipProduction: false,
      secretLeakFindings: publicScanFindings.filter((item) => item.rule === "secret-like-content").length,
      fakeLiveClaimsFound: publicScanFindings.filter((item) => item.rule === "unsupported-security-or-live-claim").length
    },
    commandResults,
    artifacts: {
      publicPage: "apps/web/app/open-source/security-redteam/page.tsx",
      publicMarkdown: "apps/web/public/gitcaster-security-redteam.md",
      redteamPlan: "docs/security/redteam-plan.md",
      auditRehearsal: "docs/security/crypto-audit-rehearsal.md",
      pr18: "launch/evidence/pr-18-security-gate.json",
      pr27: "launch/evidence/pr-27-security-redteam-crypto-audit.json",
      suite: "launch/evidence/redteam-suite-result.json",
      pr17Blocked: "launch/evidence/pr-17-castercloud-qstorage-pipeline.json"
    },
    releaseQuality: {
      releaseLevel: "public-alpha",
      canShipProduction: false,
      externalAudit: "required",
      productionBlockers: [
        "External security audit evidence is still required.",
        "Managed infrastructure security evidence is still closed and unavailable in this public repo.",
        "Public node federation, QStorage, CasterCloud, .caster, custody, billing, rollback, and production operation proofs remain blocked.",
        "This release is local deterministic proof tooling only."
      ]
    },
    findings: {
      missingFiles,
      missingArtifacts,
      publicScanFindings
    },
    blockers
  };

  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({
    status: evidence.status,
    evidence: "launch/evidence/security-redteam-public-hardening-source.json",
    blockers,
    pr18: evidence.summary.pr18SecurityGateStatus,
    pr27: evidence.summary.pr27RedteamStatus,
    redteam: evidence.summary.redteamSuiteStatus
  }, null, 2));
  if (blockers.length) process.exitCode = 1;
}

if (require.main === module) main();
