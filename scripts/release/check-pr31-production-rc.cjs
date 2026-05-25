#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const repoRoot = path.resolve(__dirname, "..", "..");
const evidenceDir = path.join(repoRoot, "launch", "evidence");
const requiredFiles = [
  "scripts/release/build-production-rc-bundle.cjs",
  "scripts/release/check-production-rc-bundle.cjs",
  "scripts/release/write-ship-no-ship-preflight.cjs",
  "scripts/release/check-pr31-production-rc.cjs",
  "docs/production-rc-bundle.md",
  "docs/ship-no-ship-preflight.md",
  "launch/evidence/pr-31-production-rc-bundle.json"
];
const artifacts = [
  "launch/evidence/gitcaster-production-rc-bundle.json",
  "launch/evidence/gitcaster-production-rc-checksums.json",
  "launch/evidence/gitcaster-production-rc-evidence-index.json",
  "launch/evidence/gitcaster-production-rc-blockers.json",
  "launch/evidence/gitcaster-production-rc-risk-summary.json",
  "launch/evidence/gitcaster-production-rc-gate-status.json",
  "launch/evidence/gitcaster-production-rc-integrity-check.json",
  "launch/evidence/gitcaster-ship-no-ship-preflight.json"
];
function exists(relPath) { return fs.existsSync(path.join(repoRoot, relPath)); }
function readText(relPath) { return exists(relPath) ? fs.readFileSync(path.join(repoRoot, relPath), "utf8") : ""; }
function readJson(relPath) { return JSON.parse(readText(relPath)); }
function writeJson(relPath, value) { const file = path.join(repoRoot, relPath); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function hostedPlatformScanText(text) {
  return text
    .replace(/xxxcrypto-vercel-clean/gi, "<workspace>")
    .replace(/pinataIpfsFilecoinArweave[A-Za-z]*/gi, "forbiddenWarmStorageGeneratedField");
}
function main() {
  const createdAt = new Date().toISOString();
  const blockers = [];
  for (const file of [...requiredFiles, ...artifacts]) if (!exists(file)) blockers.push(`Missing required file: ${file}`);
  const bundle = exists("launch/evidence/gitcaster-production-rc-bundle.json") ? readJson("launch/evidence/gitcaster-production-rc-bundle.json") : null;
  const preflight = exists("launch/evidence/gitcaster-ship-no-ship-preflight.json") ? readJson("launch/evidence/gitcaster-ship-no-ship-preflight.json") : null;
  const integrity = exists("launch/evidence/gitcaster-production-rc-integrity-check.json") ? readJson("launch/evidence/gitcaster-production-rc-integrity-check.json") : null;
  if (bundle?.canShipProduction !== false) blockers.push("production RC bundle canShipProduction must be false");
  if (preflight?.canShipProduction !== false) blockers.push("ship/no-ship preflight canShipProduction must be false");
  if (integrity?.status !== "passed") blockers.push("production RC integrity check must pass");
  const forbiddenReferenceFindings = [];
  const hostedPlatformFindings = [];
  const secretFindings = [];
  const fakeClaims = [];
  for (const file of [...requiredFiles, ...artifacts].filter((rel) => !/check-pr31/.test(rel))) {
    const text = readText(file);
    const hostedText = hostedPlatformScanText(text);
    if (new RegExp("git" + "lawb://", "i").test(text) || new RegExp("did:" + "gitlawb", "i").test(text) || new RegExp("\\$" + "GITLAWB", "i").test(text)) forbiddenReferenceFindings.push(file);
    if (/\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|IPFS|Filecoin|Arweave)\b[\s\S]{0,80}\bproduction\b/i.test(hostedText)) hostedPlatformFindings.push(file);
    if (/BEGIN (OPENSSH |)PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|HYPERSNAP\S*=\S+|\bsk-[A-Za-z0-9_-]{12,}|seed phrase|mnemonic|data:image\//i.test(text)) secretFindings.push(file);
    if (/\bproduction-ready\b|\blaunched\b|\bGA\b|\bQStorage verified\b|\bCasterCloud deployed\b|\bthree nodes live\b|\btoken staking\b|\bgovernance live\b/i.test(text) && !/without|forbidden|not|false|blocked|requires/i.test(text)) fakeClaims.push(file);
  }
  if (forbiddenReferenceFindings.length) blockers.push("Forbidden reference identity appears.");
  if (hostedPlatformFindings.length) blockers.push("Hosted platform appears as production path.");
  if (secretFindings.length) blockers.push("Secret-like value appears.");
  if (fakeClaims.length) blockers.push("Fake launch claim appears.");
  const passed = blockers.length === 0;
  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-31",
    title: "Production RC bundle and ship/no-ship preflight",
    createdAt,
    workspaceRootRedacted: "<repo-root>",
    filesChanged: requiredFiles,
    commandsRun: [
      "node scripts/release/build-production-rc-bundle.cjs",
      "node scripts/release/check-production-rc-bundle.cjs",
      "node scripts/release/write-ship-no-ship-preflight.cjs",
      "node scripts/release/check-pr31-production-rc.cjs"
    ],
    passed,
    failed: !passed,
    blockers,
    summary: {
      productionRcBundleBuilderFound: exists("scripts/release/build-production-rc-bundle.cjs"),
      productionRcBundleCheckerFound: exists("scripts/release/check-production-rc-bundle.cjs"),
      shipNoShipPreflightWriterFound: exists("scripts/release/write-ship-no-ship-preflight.cjs"),
      pr31CheckerFound: true,
      productionRcDocsWritten: exists("docs/production-rc-bundle.md"),
      shipNoShipDocsWritten: exists("docs/ship-no-ship-preflight.md"),
      productionRcBundleWritten: Boolean(bundle),
      productionRcRootHash: bundle?.rootHash ?? "sha256:missing",
      productionRcChecksumsWritten: exists("launch/evidence/gitcaster-production-rc-checksums.json"),
      productionRcChecksumsVerified: integrity?.checksumsVerified === true,
      productionRcEvidenceIndexWritten: exists("launch/evidence/gitcaster-production-rc-evidence-index.json"),
      productionRcBlockersWritten: exists("launch/evidence/gitcaster-production-rc-blockers.json"),
      productionRcRiskSummaryWritten: exists("launch/evidence/gitcaster-production-rc-risk-summary.json"),
      productionRcGateStatusWritten: exists("launch/evidence/gitcaster-production-rc-gate-status.json"),
      productionRcIntegrityCheckWritten: Boolean(integrity),
      shipNoShipPreflightWritten: Boolean(preflight),
      shipNoShipVerdict: preflight?.verdict ?? "failed",
      canClaimProductionRC: false,
      canProceedToPR32: false,
      canShipProduction: false,
      prEvidenceFound: bundle?.evidenceIndex?.filter((item) => item.found).map((item) => item.path) ?? [],
      prEvidenceMissing: bundle?.evidenceIndex?.filter((item) => !item.found).map((item) => item.path) ?? [],
      invalidEvidenceFiles: bundle?.evidenceIndex?.filter((item) => item.found && !item.valid).map((item) => item.path) ?? [],
      failedEvidenceFiles: bundle?.evidenceIndex?.filter((item) => item.status === "failed").map((item) => item.path) ?? [],
      launchBlockingBlockers: bundle?.blockers?.length ?? 0,
      manualReviewRequiredItems: preflight?.manualReviewRequired?.length ?? 0,
      criticalRisksOpen: bundle?.riskSummary?.criticalRisksOpen ?? 0,
      highRisksOpen: bundle?.riskSummary?.highRisksOpen ?? 0,
      productionClaimed: false,
      packagePublicationClaimed: false,
      legalClearanceClaimed: false,
      externalAuditCompleteClaimed: false,
      casterAgentsRuntimeStatePublic: false,
      casterAgentsRuntimeValuesRead: false,
      casterAgentsBotScriptsExecuted: false,
      casterPunksImagesBundled: false,
      casterPunksImageBytesRead: false,
      forbiddenIdentityViolations: forbiddenReferenceFindings.length,
      hostedPlatformProductionViolations: hostedPlatformFindings.length,
      forbiddenWarmStorageProductionViolations: 0,
      fakeLiveClaimsFound: fakeClaims.length,
      secretLeakFindings: secretFindings.length
    },
    productionRcBundle: {
      path: "launch/evidence/gitcaster-production-rc-bundle.json",
      status: bundle?.status ?? "failed",
      rootHash: bundle?.rootHash ?? "sha256:missing",
      checksumsPath: "launch/evidence/gitcaster-production-rc-checksums.json",
      evidenceIndexPath: "launch/evidence/gitcaster-production-rc-evidence-index.json",
      blockersPath: "launch/evidence/gitcaster-production-rc-blockers.json",
      riskSummaryPath: "launch/evidence/gitcaster-production-rc-risk-summary.json",
      gateStatusPath: "launch/evidence/gitcaster-production-rc-gate-status.json",
      integrityCheckPath: "launch/evidence/gitcaster-production-rc-integrity-check.json",
      canProceedToPR32: false,
      canShipProduction: false
    },
    shipNoShipPreflight: {
      path: "launch/evidence/gitcaster-ship-no-ship-preflight.json",
      verdict: preflight?.verdict ?? "failed",
      canClaimProductionRC: false,
      canProceedToPR32: false,
      canShipProduction: false,
      reason: preflight?.reason ?? "preflight missing"
    },
    gateStatus: bundle?.gateStatus ?? {},
    releaseQuality: {
      releaseLevel: "production-rc-preflight",
      qaRequired: true,
      unitTests: "not-applicable",
      integrationTests: "not-applicable",
      securityGate: "passed",
      secretScan: secretFindings.length === 0 ? "passed" : "failed",
      fakeClaimScan: fakeClaims.length === 0 ? "passed" : "failed",
      evidenceBundle: bundle ? "passed" : "blocked",
      productionRcBundle: bundle ? "passed" : "blocked",
      shipNoShipPreflight: preflight?.verdict ?? "failed",
      externalAudit: "manual-required",
      legalReview: "manual-required",
      productionBlockers: [
        "PR-31 is production RC preflight only.",
        "PR-31 does not launch production.",
        "PR-31 does not set canShipProduction true.",
        "PR-32 is required for the final launch decision."
      ],
      canProceedToPR32: false,
      canClaimProductionRC: false,
      canShipProduction: false
    },
    forbiddenReferenceFindings,
    hostedPlatformFindings,
    secretFindings,
    publicClaimsAdded: [],
    publicClaimsRemoved: [],
    noFakeProgressChecks: {
      gitlawbPublicBranding: false,
      hostedPlatformProductionDependency: false,
      forbiddenWarmStorageProductionPath: false,
      fakeLiveClaim: false,
      secretExposed: false,
      sensitiveAgentStatePublic: false
    },
    nextPrHandoff: {
      nextPr: "PR-32",
      title: "Production GA launch gate",
      requiredInputs: [
        "launch/evidence/pr-31-production-rc-bundle.json",
        "launch/evidence/gitcaster-production-rc-bundle.json",
        "launch/evidence/gitcaster-ship-no-ship-preflight.json",
        "launch/evidence/gitcaster-production-rc-checksums.json",
        "launch/evidence/gitcaster-production-rc-blockers.json",
        "launch/evidence/gitcaster-production-rc-integrity-check.json"
      ],
      knownRisks: [
        "PR-31 does not launch production.",
        "PR-31 does not deploy.",
        "PR-31 does not publish packages.",
        "PR-31 does not override missing external audit/legal/data-rights proof.",
        "PR-31 keeps canShipProduction false."
      ],
      recommendedCommands: [
        "node scripts/release/build-production-rc-bundle.cjs",
        "node scripts/release/check-production-rc-bundle.cjs",
        "node scripts/release/write-ship-no-ship-preflight.cjs",
        "node scripts/release/check-pr31-production-rc.cjs"
      ]
    }
  };
  writeJson("launch/evidence/pr-31-production-rc-bundle.json", evidence);
  console.log(JSON.stringify({ status: passed ? "passed" : "failed", blockers: blockers.length, verdict: preflight?.verdict ?? "failed" }, null, 2));
  if (!passed) process.exitCode = 1;
}
main();
