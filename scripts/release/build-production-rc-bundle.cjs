#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidenceDir = path.join(repoRoot, "launch", "evidence");
const prEvidence = [
  "pr-00-state-snapshot.json",
  "pr-01-monorepo-boundary.json",
  "pr-02-protocol-fixtures.json",
  "pr-03-identity-signed-envelopes.json",
  "pr-04-local-alpha-node.json",
  "pr-05-repo-create-event-log.json",
  "pr-06-object-store-qstorage-blockers.json",
  "pr-07-ref-certificates.json",
  "pr-08-push-local.json",
  "pr-09-git-remote-helper.json",
  "pr-10-issues-prs.json",
  "pr-11-mcp-tools.json",
  "pr-12-web-status-proof-ui.json",
  "pr-13-canonical-ecosystem.json",
  "pr-14-claim-miniapp-import.json",
  "pr-15-caster-punks-lite-index.json",
  "pr-16-casteragents-safety-lock.json",
  "pr-17-castercloud-qstorage-pipeline.json",
  "pr-18-security-gate.json",
  "pr-19-golden-path-demo.json",
  "pr-20-beta-evidence-bundle.json",
  "pr-21-production-qa-matrix.json",
  "pr-22-git-transport-rc.json",
  "pr-23-castercloud-qstorage-live-gate.json",
  "pr-24-public-node-ops-federation.json",
  "pr-25-web-production-hardening.json",
  "pr-26-tooling-release-hardening-sdk-packaging.json",
  "pr-27-security-redteam-crypto-audit.json",
  "pr-28-ecosystem-rc-import.json",
  "pr-29-observability-incident-rollback.json",
  "pr-30-audit-license-data-rights.json"
];

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(evidenceDir, name), "utf8"));
}
function writeJson(name, value) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`);
}
function sha256(text) {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
}
function fileHash(name) {
  const file = path.join(evidenceDir, name);
  return fs.existsSync(file) ? sha256(fs.readFileSync(file)) : "sha256:missing";
}

function main() {
  const createdAt = new Date().toISOString();
  const evidenceIndex = prEvidence.map((name) => {
    const found = fs.existsSync(path.join(evidenceDir, name));
    let parsed = null;
    let valid = false;
    if (found) {
      try {
        parsed = readJson(name);
        valid = true;
      } catch {
        valid = false;
      }
    }
    return {
      path: `launch/evidence/${name}`,
      found,
      valid,
      passed: Boolean(parsed?.passed ?? parsed?.status === "passed"),
      status: parsed?.status ?? (parsed?.passed ? "passed" : found ? "present" : "missing"),
      canShipProduction: parsed?.releaseQuality?.canShipProduction === true || parsed?.canShipProduction === true,
      rootHash: parsed?.rootHash ?? parsed?.ecosystemRc?.rootHash ?? parsed?.productionRcBundle?.rootHash ?? null,
      checksum: fileHash(name)
    };
  });
  const missing = evidenceIndex.filter((item) => !item.found).map((item) => item.path);
  const invalid = evidenceIndex.filter((item) => item.found && !item.valid).map((item) => item.path);
  const unsafe = evidenceIndex.filter((item) => item.canShipProduction).map((item) => item.path);
  const pr30 = fs.existsSync(path.join(evidenceDir, "pr-30-audit-license-data-rights.json")) ? readJson("pr-30-audit-license-data-rights.json") : null;
  const auditApproval = fs.existsSync(path.join(evidenceDir, "gitcaster-audit-approval.json")) ? readJson("gitcaster-audit-approval.json") : null;
  const auditApprovalPassed = auditApproval?.status === "passed" && auditApproval?.canUnblockProduction === true;
  const blockers = [
    ...missing.map((item) => `Missing evidence: ${item}`),
    ...invalid.map((item) => `Invalid evidence: ${item}`),
    ...unsafe.map((item) => `Pre-PR32 canShipProduction true: ${item}`)
  ];
  if (!auditApprovalPassed && ((pr30?.summary?.licenseReviewBlocked ?? 0) > 0 || (pr30?.summary?.dataRightsBlockedSensitive ?? 0) > 0 || pr30?.releaseQuality?.externalAudit === "external-audit-required")) {
    blockers.push("Audit/license/data-rights review remains production-blocking.");
  }
  const gateStatus = {
    type: "gitcaster.production-rc.gate-status.v1",
    createdAt,
    securityProofGate: gate("pr-18-security-gate.json"),
    productionQaMatrix: gate("pr-21-production-qa-matrix.json"),
    gitTransportRc: gate("pr-22-git-transport-rc.json"),
    qstorageCastercloudLiveGate: gate("pr-23-castercloud-qstorage-live-gate.json"),
    publicNodeFederation: gate("pr-24-public-node-ops-federation.json"),
    webHardening: gate("pr-25-web-production-hardening.json"),
    toolingSdk: gate("pr-26-tooling-release-hardening-sdk-packaging.json"),
    redteam: gate("pr-27-security-redteam-crypto-audit.json"),
    ecosystemRc: gate("pr-28-ecosystem-rc-import.json"),
    observabilityRollback: gate("pr-29-observability-incident-rollback.json"),
    auditLicenseDataRights: gate("pr-30-audit-license-data-rights.json"),
    productionLaunchGate: "blocked"
  };
  const riskSummary = {
    type: "gitcaster.production-rc.risk-summary.v1",
    status: blockers.length ? "production-rc-blocked" : "production-rc-ready-for-pr32",
    createdAt,
    criticalRisksOpen: blockers.length ? 1 : 0,
    highRisksOpen: blockers.length,
    manualReviewRequired: !auditApprovalPassed && pr30?.summary?.manualCounselReviewRequired === true,
    auditApprovalImported: auditApprovalPassed,
    canShipProduction: false
  };
  const bundle = {
    type: "gitcaster.production-rc.bundle.v1",
    status: blockers.length ? "production-rc-blocked" : "production-rc-ready-for-pr32",
    createdAt,
    product: "GitCaster",
    evidenceIndex,
    gateStatus,
    riskSummary,
    blockers,
    shipAllowedClaims: [
      "GitCaster has local-alpha repo workflow evidence.",
      "GitCaster has signed identity and envelope evidence.",
      "GitCaster has local-alpha push-local evidence.",
      "GitCaster has issue/PR/MCP evidence.",
      "GitCaster has web claim-guard evidence.",
      "GitCaster has SDK/tooling local-alpha evidence.",
      "GitCaster has internal red-team rehearsal evidence.",
      "GitCaster has audit/license/data-rights inventory evidence.",
      "GitCaster has production RC bundle evidence."
    ],
    shipBlockedClaims: [
      "Production launch is not allowed before PR-32.",
      "canShipProduction must remain false in PR-31."
    ],
    canProceedToPR32: false,
    canShipProduction: false
  };
  bundle.rootHash = sha256(JSON.stringify({ ...bundle, rootHash: undefined }));
  const checksums = {
    type: "gitcaster.production-rc.checksums.v1",
    createdAt,
    files: evidenceIndex.map((item) => ({ path: item.path, checksum: item.checksum })),
    rootHash: sha256(JSON.stringify(evidenceIndex)),
    canShipProduction: false
  };
  writeJson("gitcaster-production-rc-evidence-index.json", { type: "gitcaster.production-rc.evidence-index.v1", createdAt, evidence: evidenceIndex, canShipProduction: false });
  writeJson("gitcaster-production-rc-blockers.json", { type: "gitcaster.production-rc.blockers.v1", status: blockers.length ? "blocked" : "passed", createdAt, blockers, canShipProduction: false });
  writeJson("gitcaster-production-rc-risk-summary.json", riskSummary);
  writeJson("gitcaster-production-rc-gate-status.json", gateStatus);
  writeJson("gitcaster-production-rc-checksums.json", checksums);
  writeJson("gitcaster-production-rc-bundle.json", bundle);
  patchPr31(createdAt, bundle, blockers, missing, invalid);
  console.log(JSON.stringify({ status: bundle.status, blockers: blockers.length, rootHash: bundle.rootHash }, null, 2));
}

function gate(name) {
  if (!fs.existsSync(path.join(evidenceDir, name))) return "missing";
  try {
    const json = readJson(name);
    if (json.passed === true || json.status === "passed") return "passed";
    if (json.failed === true || json.status === "failed") return "failed";
    return "blocked";
  } catch {
    return "failed";
  }
}

function patchPr31(createdAt, bundle, blockers, missing, invalid) {
  const file = path.join(evidenceDir, "pr-31-production-rc-bundle.json");
  const existing = fs.existsSync(file) ? readJson("pr-31-production-rc-bundle.json") : {};
  writeJson("pr-31-production-rc-bundle.json", {
    ...existing,
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-31",
    title: "Production RC bundle and ship/no-ship preflight",
    createdAt: existing.createdAt ?? createdAt,
    workspaceRootRedacted: "<repo-root>",
    passed: false,
    failed: false,
    blockers,
    summary: {
      ...(existing.summary ?? {}),
      productionRcBundleWritten: true,
      productionRcRootHash: bundle.rootHash,
      productionRcChecksumsWritten: true,
      productionRcEvidenceIndexWritten: true,
      productionRcBlockersWritten: true,
      productionRcRiskSummaryWritten: true,
      productionRcGateStatusWritten: true,
      prEvidenceMissing: missing,
      invalidEvidenceFiles: invalid,
      launchBlockingBlockers: blockers.length,
      canProceedToPR32: false,
      canShipProduction: false
    }
  });
}

main();
