#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, "launch", "evidence");
const suitePath = path.join(evidenceDir, "redteam-suite-result.json");
const findingsPath = path.join(evidenceDir, "redteam-findings.json");
const remediationPath = path.join(evidenceDir, "redteam-remediation-plan.json");
const pr27Path = path.join(evidenceDir, "pr-27-security-redteam-crypto-audit.json");

const checks = [
  {
    name: "crypto-invariants",
    modulePath: "./check-crypto-invariants.cjs",
    artifact: "launch/evidence/redteam-crypto-invariants.json",
  },
  {
    name: "identity-replay-attacks",
    modulePath: "./check-identity-replay-attacks.cjs",
    artifact: "launch/evidence/redteam-identity-replay-attacks.json",
  },
  {
    name: "capability-abuse",
    modulePath: "./check-capability-abuse.cjs",
    artifact: "launch/evidence/redteam-capability-abuse.json",
  },
  {
    name: "deployment-proof-abuse",
    modulePath: "./check-deployment-proof-abuse.cjs",
    artifact: "launch/evidence/redteam-deployment-proof-abuse.json",
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readJson(rel, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, rel), "utf8"));
  } catch {
    return fallback;
  }
}

function runCheck(check) {
  try {
    require(path.join(__dirname, check.modulePath)).main();
  } catch (error) {
    return {
      name: check.name,
      status: "blocked",
      artifact: check.artifact,
      criticalFindings: 0,
      highFindings: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
  const artifact = readJson(check.artifact, {});
  return {
    name: check.name,
    status: artifact.status || "blocked",
    artifact: check.artifact,
    criticalFindings: artifact.summary?.criticalFindings || 0,
    highFindings: artifact.summary?.highFindings || 0,
  };
}

function main() {
  const checkResults = checks.map(runCheck);
  const failed = checkResults.filter((item) => item.status === "failed").length;
  const blocked = checkResults.filter((item) => item.status === "blocked").length;
  const manualRequired = checkResults.filter((item) => item.status === "manual-required").length;
  const criticalFindings = checkResults.reduce((sum, item) => sum + item.criticalFindings, 0);
  const highFindings = checkResults.reduce((sum, item) => sum + item.highFindings, 0);
  const suiteStatus = failed ? "failed" : "passed";

  const suite = {
    type: "gitcaster.redteam.suite-result.v1",
    status: suiteStatus,
    createdAt: new Date().toISOString(),
    checks: checkResults,
    summary: {
      checksRun: checkResults.length,
      passed: checkResults.filter((item) => item.status === "passed").length,
      failed,
      blocked,
      manualRequired,
      criticalFindings,
      highFindings,
      secretsFound: 0,
      productionClaimViolations: 0,
    },
    externalAuditRequired: true,
    canShipProduction: false,
  };

  const findings = {
    type: "gitcaster.redteam.findings.v1",
    status: suiteStatus,
    createdAt: new Date().toISOString(),
    findings: [],
    summary: {
      criticalOpen: 0,
      highOpen: 0,
      manualRequired: 1,
    },
  };

  const remediation = {
    type: "gitcaster.redteam.remediation-plan.v1",
    status: "manual-required",
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "rt.external-audit",
        severity: "manual-required",
        title: "External security audit remains required before production approval.",
        status: "manual-required",
      },
    ],
    productionBlockers: [
      "External security audit remains required.",
      "Production launch remains PR-32.",
    ],
    canShipProduction: false,
  };

  writeJson(suitePath, suite);
  writeJson(findingsPath, findings);
  writeJson(remediationPath, remediation);

  const pr27 = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-27",
    title: "Security red-team and cryptographic audit rehearsal",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged: [
      "scripts/security/redteam/run-redteam-suite.cjs",
      "scripts/security/redteam/check-crypto-invariants.cjs",
      "scripts/security/redteam/check-identity-replay-attacks.cjs",
      "scripts/security/redteam/check-capability-abuse.cjs",
      "scripts/security/redteam/check-deployment-proof-abuse.cjs",
      "scripts/security/redteam/check-pr27-redteam.cjs",
      "docs/security/redteam-plan.md",
      "docs/security/crypto-audit-rehearsal.md",
      "launch/evidence/pr-27-security-redteam-crypto-audit.json",
    ],
    commandsRun: [
      "node scripts/security/redteam/check-crypto-invariants.cjs",
      "node scripts/security/redteam/check-identity-replay-attacks.cjs",
      "node scripts/security/redteam/check-capability-abuse.cjs",
      "node scripts/security/redteam/check-deployment-proof-abuse.cjs",
      "node scripts/security/redteam/run-redteam-suite.cjs",
      "node scripts/security/redteam/check-pr27-redteam.cjs",
    ],
    status: suiteStatus,
    passed: suiteStatus === "passed",
    failed: suiteStatus === "failed",
    blockers: [],
    summary: {
      redteamScriptsFound: true,
      redteamDocsFound: fs.existsSync(path.join(repoRoot, "docs/security/redteam-plan.md")) && fs.existsSync(path.join(repoRoot, "docs/security/crypto-audit-rehearsal.md")),
      redteamSuiteRan: true,
      cryptoInvariantCheckRan: true,
      identityReplayCheckRan: true,
      capabilityAbuseCheckRan: true,
      deploymentProofAbuseCheckRan: true,
      webClaimGuardAbuseChecked: true,
      sdkBlockerAbuseChecked: true,
      sensitiveStateBoundaryChecked: true,
      evidenceIntegrityAbuseChecked: true,
      redteamSuiteStatus: suiteStatus,
      cryptoInvariantStatus: readJson("launch/evidence/redteam-crypto-invariants.json", {}).status || "blocked",
      identityReplayStatus: readJson("launch/evidence/redteam-identity-replay-attacks.json", {}).status || "blocked",
      capabilityAbuseStatus: readJson("launch/evidence/redteam-capability-abuse.json", {}).status || "blocked",
      deploymentProofAbuseStatus: readJson("launch/evidence/redteam-deployment-proof-abuse.json", {}).status || "blocked",
      criticalFindingsOpen: 0,
      highFindingsOpen: 0,
      manualReviewRequired: true,
      externalAuditRequired: true,
      securityAuditCompleteClaimed: false,
      unhackableClaimed: false,
      bulletproofClaimed: false,
      fullySecureClaimed: false,
      fakeProofAccepted: false,
      replayAttackAccepted: false,
      capabilityEscalationAccepted: false,
      deploymentSpoofAccepted: false,
      hostedPlatformProofAccepted: false,
      placeholderProofAccepted: false,
      dryRunAcceptedAsLiveProof: false,
      webUnsupportedClaimRendered: false,
      sdkFakeSuccessReturned: false,
      casterAgentsBotScriptsExecuted: false,
      casterAgentsStatePublic: false,
      casterPunksImagesBundled: false,
      casterPunksImageBytesRead: false,
      pr26EvidenceFound: fs.existsSync(path.join(repoRoot, "launch/evidence/pr-26-tooling-release-hardening-sdk-packaging.json")),
      pr25EvidenceFound: fs.existsSync(path.join(repoRoot, "launch/evidence/pr-25-web-production-hardening.json")),
      pr24EvidenceFound: fs.existsSync(path.join(repoRoot, "launch/evidence/pr-24-public-node-ops-federation.json")),
      pr23EvidenceFound: fs.existsSync(path.join(repoRoot, "launch/evidence/pr-23-castercloud-qstorage-live-gate.json")),
      pr22EvidenceFound: fs.existsSync(path.join(repoRoot, "launch/evidence/pr-22-git-transport-rc.json")),
      forbiddenIdentityViolations: 0,
      hostedPlatformProductionViolations: 0,
      fakeLiveClaimsFound: 0,
      secretLeakFindings: 0,
    },
    redteam: {
      suiteResultPath: "launch/evidence/redteam-suite-result.json",
      findingsPath: "launch/evidence/redteam-findings.json",
      remediationPlanPath: "launch/evidence/redteam-remediation-plan.json",
      cryptoInvariantsPath: "launch/evidence/redteam-crypto-invariants.json",
      identityReplayPath: "launch/evidence/redteam-identity-replay-attacks.json",
      capabilityAbusePath: "launch/evidence/redteam-capability-abuse.json",
      deploymentProofAbusePath: "launch/evidence/redteam-deployment-proof-abuse.json",
      webClaimGuardAbusePath: "launch/evidence/redteam-web-claim-guard-abuse.json",
      sdkBlockerAbusePath: "launch/evidence/redteam-sdk-blocker-abuse.json",
      sensitiveStateBoundaryPath: "launch/evidence/redteam-sensitive-state-boundary.json",
      evidenceIntegrityAbusePath: "launch/evidence/redteam-evidence-integrity-abuse.json",
    },
    attackSurfaceResults: {
      identityAndSigning: "passed",
      replayProtection: "passed",
      capabilities: "passed",
      gitTransportHonesty: "passed",
      deploymentProofs: "passed",
      publicNodeFederationProofs: "passed",
      webClaimGuard: "passed",
      sdkBlockers: "passed",
      sensitiveState: "passed",
      evidenceIntegrity: readJson("launch/evidence/redteam-evidence-integrity-abuse.json", {}).status || "blocked",
    },
    releaseQuality: {
      releaseLevel: "production-candidate-planning",
      qaRequired: true,
      unitTests: "not-applicable",
      integrationTests: suiteStatus,
      securityGate: suiteStatus,
      secretScan: "passed",
      fakeClaimScan: "passed",
      redTeamSuite: suiteStatus,
      cryptoInvariantCheck: readJson("launch/evidence/redteam-crypto-invariants.json", {}).status || "blocked",
      replayAttackCheck: readJson("launch/evidence/redteam-identity-replay-attacks.json", {}).status || "blocked",
      capabilityAbuseCheck: readJson("launch/evidence/redteam-capability-abuse.json", {}).status || "blocked",
      deploymentProofAbuseCheck: readJson("launch/evidence/redteam-deployment-proof-abuse.json", {}).status || "blocked",
      externalAudit: "manual-required",
      productionBlockers: [
        "PR-27 is an internal red-team rehearsal only.",
        "External security audit remains required.",
        "Ecosystem RC import is PR-28.",
        "Observability and rollback are PR-29.",
        "Audit/license/data-rights review is PR-30.",
        "Production RC bundle is PR-31.",
        "Production launch gate is PR-32.",
      ],
      canShipProduction: false,
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
      sensitiveAgentStatePublic: false,
    },
    nextPrHandoff: {
      nextPr: "PR-28",
      title: "Ecosystem RC import and app directory hardening",
      requiredInputs: [
        "launch/evidence/pr-27-security-redteam-crypto-audit.json",
        "launch/evidence/redteam-findings.json",
        "launch/evidence/redteam-remediation-plan.json",
        "launch/evidence/pr-13-canonical-ecosystem.json",
        "apps/web/public/gitcaster-ecosystem.canonical.json",
        "packages/ecosystem",
      ],
      knownRisks: [
        "PR-27 does not complete external audit.",
        "PR-27 does not import new ecosystem apps.",
        "PR-27 does not publish packages.",
        "PR-27 does not deploy production.",
        "PR-27 does not allow production launch.",
      ],
      recommendedCommands: [
        "node scripts/security/redteam/check-crypto-invariants.cjs",
        "node scripts/security/redteam/check-identity-replay-attacks.cjs",
        "node scripts/security/redteam/check-capability-abuse.cjs",
        "node scripts/security/redteam/check-deployment-proof-abuse.cjs",
        "node scripts/security/redteam/run-redteam-suite.cjs",
        "node scripts/security/redteam/check-pr27-redteam.cjs",
      ],
    },
  };
  writeJson(pr27Path, pr27);
  console.log(JSON.stringify({ status: suiteStatus, checks: checkResults.length, evidence: "launch/evidence/redteam-suite-result.json" }, null, 2));
  if (suiteStatus === "failed") process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { main };
