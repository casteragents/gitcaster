#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-27-security-redteam-crypto-audit.json");
const requiredFiles = [
  "scripts/security/redteam/run-redteam-suite.cjs",
  "scripts/security/redteam/check-crypto-invariants.cjs",
  "scripts/security/redteam/check-identity-replay-attacks.cjs",
  "scripts/security/redteam/check-capability-abuse.cjs",
  "scripts/security/redteam/check-deployment-proof-abuse.cjs",
  "scripts/security/redteam/check-pr27-redteam.cjs",
  "docs/security/redteam-plan.md",
  "docs/security/crypto-audit-rehearsal.md",
  "launch/evidence/pr-27-security-redteam-crypto-audit.json",
];
const requiredArtifacts = [
  "launch/evidence/redteam-suite-result.json",
  "launch/evidence/redteam-crypto-invariants.json",
  "launch/evidence/redteam-identity-replay-attacks.json",
  "launch/evidence/redteam-capability-abuse.json",
  "launch/evidence/redteam-deployment-proof-abuse.json",
  "launch/evidence/redteam-web-claim-guard-abuse.json",
  "launch/evidence/redteam-sdk-blocker-abuse.json",
  "launch/evidence/redteam-sensitive-state-boundary.json",
  "launch/evidence/redteam-evidence-integrity-abuse.json",
  "launch/evidence/redteam-findings.json",
  "launch/evidence/redteam-remediation-plan.json",
];

const forbiddenIdentity = [
  "Git" + "lawb",
  "git" + "lawb://",
  "did:" + "gitlawb",
  "GIT" + "LAWB_NODE",
  "GIT" + "LAWB_DID",
  "GIT" + "LAWB_KEY",
  "~/.git" + "lawb",
  "git-remote-git" + "lawb",
  "$" + "GITLAWB",
  "node.git" + "lawb.com",
];
const productionReady = "production" + "-" + "ready";
const secretPatterns = [
  { name: "private-key", pattern: /BEGIN (?:OPENSSH )?PRIVATE KEY/ },
  { name: "api-key", pattern: /sk-[A-Za-z0-9]{16,}/ },
  { name: "bearer", pattern: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/ },
  { name: "openai", pattern: /OPENAI_API_KEY=\S+/ },
  { name: "qstorage", pattern: /CASTER_QSTORAGE_WRITE_TOKEN=\S+/ },
  { name: "castercloud", pattern: /CASTER_CLOUD_DEPLOY_TOKEN=\S+/ },
  { name: "inline-image", pattern: /data:image\// },
  { name: "long-base64", pattern: /[A-Za-z0-9+/]{500,}={0,2}/ },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return exists(rel) ? fs.readFileSync(path.join(repoRoot, rel), "utf8") : "";
}

function readJson(rel, fallback = null) {
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

function scan(rel) {
  const findings = [];
  const text = read(rel);
  if (!text) return findings;
  const isChecker = rel.startsWith("scripts/security/redteam/");
  for (const term of forbiddenIdentity) {
    if (text.includes(term) && !isChecker) findings.push({ rule: "forbidden-identity", file: rel });
  }
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(text) && !isChecker) findings.push({ rule: "secret-like-content", file: rel, name });
  }
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const lower = line.toLowerCase();
    const isAttackOrNegative = /\b(no|not|without|blocked|rejected|required|requires|false|manual|required|attack|accepted as|before pr32)\b/i.test(line);
    if ((line.includes(productionReady) || /\b(unhackable|bulletproof|fully secure|security audit complete|externally audited)\b/i.test(line)) && !isAttackOrNegative && !isChecker) {
      findings.push({ rule: "unsupported-security-claim", file: rel });
    }
    if (/\b(QStorage verified|CasterCloud deployed|CasterCloud verified|public nodes online|replicated|\.caster mapped|staking live|rewards paid|governance live)\b/i.test(line) && !isAttackOrNegative && !isChecker) {
      findings.push({ rule: "fake-live-claim", file: rel });
    }
    if (/\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|IPFS|Filecoin|Arweave)\b[^\n]{0,80}\b(production|canonical|primary|deployed|live)\b/i.test(line) && !isAttackOrNegative && !isChecker) {
      findings.push({ rule: "hosted-platform-production", file: rel });
    }
  }
  return findings;
}

function main() {
  const missingFiles = requiredFiles.filter((file) => file !== "launch/evidence/pr-27-security-redteam-crypto-audit.json" && !exists(file));
  const missingArtifacts = requiredArtifacts.filter((file) => !exists(file));
  const pr27 = readJson("launch/evidence/pr-27-security-redteam-crypto-audit.json", {});
  const suite = readJson("launch/evidence/redteam-suite-result.json", {});
  const findingsArtifact = readJson("launch/evidence/redteam-findings.json", {});
  const deployment = readJson("launch/evidence/redteam-deployment-proof-abuse.json", {});
  const sensitive = readJson("launch/evidence/redteam-sensitive-state-boundary.json", {});
  const integrity = readJson("launch/evidence/redteam-evidence-integrity-abuse.json", {});
  const scanFindings = [...requiredFiles, ...requiredArtifacts].filter(exists).flatMap(scan);
  const blockers = [];

  blockers.push(...missingFiles.map((file) => `Missing PR-27 file: ${file}`));
  blockers.push(...missingArtifacts.map((file) => `Missing PR-27 artifact: ${file}`));
  if (pr27.type !== "gitcaster.pr.evidence.v1") blockers.push("PR-27 evidence type is invalid.");
  if (pr27.pr !== "PR-27") blockers.push("PR-27 evidence must identify PR-27.");
  if (!pr27.releaseQuality || pr27.releaseQuality.canShipProduction !== false) blockers.push("releaseQuality.canShipProduction must be false.");
  if (suite.status !== "passed") blockers.push("Red-team suite must pass or record blocker honestly.");
  if ((findingsArtifact.summary?.criticalOpen || 0) > 0 || (findingsArtifact.summary?.highOpen || 0) > 0) {
    blockers.push("Critical/high findings remain open.");
  }
  if (deployment.summary?.fakeProofAccepted === true || deployment.summary?.hostedPlatformProofAccepted === true || deployment.summary?.placeholderProofAccepted === true || deployment.summary?.dryRunAcceptedAsLiveProof === true) {
    blockers.push("Fake deployment proof was accepted.");
  }
  if (sensitive.sensitiveRuntimeContentsRead === true || sensitive.casterAgentsRuntimeStatePublic === true || sensitive.casterPunksImagesBundled === true) {
    blockers.push("Sensitive state or image bundle boundary failed.");
  }
  if ((integrity.secretFindings || []).length > 0 || (integrity.canShipProductionViolations || []).length > 0) {
    blockers.push("Evidence integrity found secrets or production approval violations.");
  }
  if (scanFindings.length) blockers.push(...scanFindings.map((item) => `${item.file}: ${item.rule}`));

  pr27.status = blockers.length ? "failed" : "passed";
  pr27.passed = blockers.length === 0;
  pr27.failed = blockers.length > 0;
  pr27.blockers = blockers;
  pr27.summary = {
    ...(pr27.summary || {}),
    forbiddenIdentityViolations: scanFindings.filter((item) => item.rule === "forbidden-identity").length,
    hostedPlatformProductionViolations: scanFindings.filter((item) => item.rule === "hosted-platform-production").length,
    fakeLiveClaimsFound: scanFindings.filter((item) => item.rule === "fake-live-claim").length,
    secretLeakFindings: scanFindings.filter((item) => item.rule === "secret-like-content").length,
  };
  writeJson(evidencePath, pr27);
  console.log(JSON.stringify({ status: pr27.status, passed: pr27.passed, blockers: blockers.length, evidence: "launch/evidence/pr-27-security-redteam-crypto-audit.json" }, null, 2));
  if (blockers.length) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { main };
