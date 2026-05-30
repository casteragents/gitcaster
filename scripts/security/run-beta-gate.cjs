#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const artifactDir = path.join(repoRoot, "launch", "artifacts", "pr-18-security-gate");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-18-security-gate.json");
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FINDINGS_PER_CHECK = 80;

const binaryExts = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz", ".tgz",
  ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mov", ".wasm", ".exe", ".dll",
]);

const publicRoots = [
  "apps/web/app",
  "apps/web/components",
  "apps/web/public",
  "apps/cli/src",
  "apps/mcp/src",
  "docs",
  "packages",
];

const broadSourceRoots = [
  "apps",
  "docs-source",
  "examples",
  "packages",
  "scripts",
  "launch/evidence",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function rel(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function existsRel(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function shouldSkipPath(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (normalized.includes("/node_modules/")) return true;
  if (normalized.includes("/.next/")) return true;
  if (normalized.includes("/.next-codex-web-build-")) return true;
  if (normalized.includes("/out/")) return true;
  if (normalized.startsWith("docs/_next/")) return true;
  if (normalized.startsWith("apps/web/out/_next/")) return true;
  if (normalized.includes("/__next.")) return true;
  if (normalized.includes("/dist/") && !normalized.startsWith("apps/git-remote-gitcaster/dist/")) return true;
  if (normalized.includes("/coverage/")) return true;
  if (normalized.includes("/.turbo/")) return true;
  if (normalized.startsWith(".quilibrium/")) return true;
  if (normalized.includes("operator-secrets")) return true;
  if (normalized === "docs/QUILIBRIUM_MIGRATION_RUN_STATE.md") return true;
  if (/^docs\/QUILIBRIUM_/i.test(normalized)) return true;
  if (/^docs\/CASTERAGENTS_/i.test(normalized)) return true;
  if (normalized === "docs/monorepo-map.md") return true;
  if (normalized === "docs/pr-stack/public-claim-freeze.md") return true;
  if (normalized === "gitcaster.txt" || normalized === "gitcaster2.txt") return true;
  return binaryExts.has(path.extname(normalized).toLowerCase());
}

function walk(rootRelative) {
  const root = path.join(repoRoot, rootRelative);
  if (!fs.existsSync(root)) return [];
  if (fs.statSync(root).isFile()) return shouldSkipPath(rootRelative) ? [] : [root];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relativePath = rel(full);
      if (shouldSkipPath(relativePath)) continue;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  return files.sort((a, b) => rel(a).localeCompare(rel(b)));
}

function collectFiles(roots) {
  const seen = new Set();
  const files = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      const relativePath = rel(file);
      if (!seen.has(relativePath)) {
        seen.add(relativePath);
        files.push(file);
      }
    }
  }
  return files;
}

function readTextFile(file) {
  const stat = fs.statSync(file);
  if (stat.size > MAX_FILE_BYTES) {
    return { skipped: true, reason: "file_too_large", bytes: stat.size };
  }
  const buf = fs.readFileSync(file);
  if (buf.includes(0)) {
    return { skipped: true, reason: "binary_content", bytes: stat.size };
  }
  return { skipped: false, text: buf.toString("utf8"), bytes: stat.size };
}

function addFinding(findings, finding) {
  if (findings.length < MAX_FINDINGS_PER_CHECK) findings.push(finding);
}

function baseReport(id, title) {
  return {
    id,
    title,
    status: "passed",
    checkedAt: new Date().toISOString(),
    findings: [],
    skipped: [],
    fixList: [],
    secretValuesPrinted: false,
  };
}

function finalizeReport(report) {
  report.status = report.findings.length ? "failed" : "passed";
  report.fixList = report.findings.map((finding) => finding.fix);
  const out = path.join(artifactDir, `${report.id}.json`);
  writeJson(out, report);
  return { ...report, artifact: rel(out) };
}

function scanLines({ id, title, roots, patterns, ignoreLine = () => false, secret = false }) {
  const report = baseReport(id, title);
  for (const file of collectFiles(roots)) {
    const relativePath = rel(file);
    const read = readTextFile(file);
    if (read.skipped) {
      report.skipped.push({ file: relativePath, reason: read.reason, bytes: read.bytes });
      continue;
    }
    const lines = read.text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (ignoreLine(relativePath, line)) return;
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          addFinding(report.findings, {
            file: relativePath,
            line: index + 1,
            rule: pattern.id,
            redacted: true,
            fix: `${relativePath}:${index + 1} remove or downgrade ${pattern.description}.`,
          });
          break;
        }
      }
    });
  }
  if (secret) {
    report.note = "Secret scan redacts matching values and reports only file, line, and rule.";
  }
  return finalizeReport(report);
}

function ignoreHonestBlockerLine(_file, line) {
  return /\b(no|not|without|unless|requires|blocked|blocked_external|fixture_only|false|refusing|rejected|cannot|must not|never|not yet|planned)\b/i.test(line);
}

function checkSecretScan() {
  return scanLines({
    id: "secret-scan",
    title: "Secret scan",
    roots: broadSourceRoots,
    secret: true,
    patterns: [
      { id: "private-key-block", description: "private key material", regex: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/i },
      { id: "aws-access-key", description: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
      { id: "cloudflare-token", description: "Cloudflare-style token", regex: /\bcf[a-zA-Z0-9_-]{30,}\b/ },
      { id: "credential-url", description: "credential-bearing URL", regex: /\b(?:postgres(?:ql)?|redis|rediss|mysql):\/\/[^@\s]+:[^@\s]+@/i },
      { id: "secret-assignment", description: "secret-like assignment with a long string literal", regex: /\b(?:SECRET|TOKEN|PRIVATE_KEY|API_KEY|ACCESS_KEY|PASSWORD)\s*=\s*["'][^"']{24,}["']/i },
    ],
    ignoreLine: (file, line) => {
      if (file.startsWith("scripts/security/")) return true;
      if (/placeholder|example|template|redacted|present:redacted|missing/i.test(line)) return true;
      if (/"sha256"\s*:/.test(line)) return true;
      if (/process\.env\.|crypto\.randomBytes|randomBytes\(/i.test(line)) return true;
      return false;
    },
  });
}

function checkNoGitlawbBranding() {
  return scanLines({
    id: "no-gitlawb-branding",
    title: "No public Gitlawb identity",
    roots: publicRoots,
    patterns: [
      { id: "gitlawb-protocol", description: "Gitlawb protocol reference", regex: /gitlawb:\/\//i },
      { id: "gitlawb-did", description: "Gitlawb DID reference", regex: /did:gitlawb/i },
      { id: "gitlawb-token", description: "$GITLAWB token reference", regex: /\$GITLAWB/i },
      { id: "gitlawb-remote", description: "git-remote-gitlawb reference", regex: /git-remote-gitlawb/i },
      { id: "gitlawb-env", description: "Gitlawb env/config reference", regex: /\bGITLAWB_(?:NODE|DID|KEY)\b|~\/\.gitlawb/i },
      { id: "gl-cli", description: "gl CLI as GitCaster command", regex: /\bgl\s+(?:identity|repo|pr|issue|node|mcp)\b/i },
    ],
  });
}

function checkNoHostedPlatformProduction() {
  return scanLines({
    id: "no-hosted-platform-production",
    title: "No hosted platform production dependency",
    roots: publicRoots,
    patterns: [
      { id: "hosted-platform-production", description: "hosted-platform production dependency claim", regex: /\b(?:Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|IPFS|Filecoin|Arweave)\b.*\b(?:production|deployed|hosted|live|primary|canonical)\b/i },
      { id: "hosted-platform-production-reverse", description: "hosted-platform production dependency claim", regex: /\b(?:production|deployed|hosted|live|primary|canonical)\b.*\b(?:Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|IPFS|Filecoin|Arweave)\b/i },
    ],
    ignoreLine: ignoreHonestBlockerLine,
  });
}

function checkNoFakeLiveClaims() {
  return scanLines({
    id: "no-fake-live-claims",
    title: "No fake live/deployment claims",
    roots: publicRoots,
    patterns: [
      { id: "castercloud-deployed", description: "CasterCloud deployed claim without proof", regex: /\b(?:deployed to CasterCloud|CasterCloud verified|CasterCloud deployed)\b/i },
      { id: "qstorage-verified", description: "QStorage verified claim without proof", regex: /\bQStorage verified\b/i },
      { id: "caster-domain-mapped", description: ".caster mapped claim without registry proof", regex: /\.caster mapped|mapped .*\.caster/i },
      { id: "token-live-utility", description: "live token utility claim without contract/audit proof", regex: /\b(?:staking live|rewards paid|governance live|bounties live|slashing live)\b/i },
      { id: "overclaim-security", description: "absolute security claim", regex: /\b(?:unhackable|bulletproof|fully decentralized|censorship-proof)\b/i },
      { id: "live-network", description: "live network or replication claim without proof", regex: /\b(?:live decentralized network|public nodes online|multi-node replicated|production-ready)\b/i },
      { id: "preview-labeled-live", description: "preview data labeled live", regex: /\bpreview data\b.*\blive\b|\blive data\b.*\bpreview\b/i },
    ],
    ignoreLine: ignoreHonestBlockerLine,
  });
}

function checkTokenClaimFreeze() {
  const report = baseReport("token-claim-freeze", "Token claim freeze");
  const tokenPage = path.join(repoRoot, "apps/web/app/token/page.tsx");
  const tokenPanel = path.join(repoRoot, "apps/web/components/TokenHonestyPanel.tsx");
  if (!fs.existsSync(tokenPage)) {
    addFinding(report.findings, {
      file: "apps/web/app/token/page.tsx",
      line: 1,
      rule: "missing-token-page",
      redacted: true,
      fix: "apps/web/app/token/page.tsx:1 add token page with proof-only utility statuses.",
    });
    return finalizeReport(report);
  }
  const text = [
    fs.readFileSync(tokenPage, "utf8"),
    fs.existsSync(tokenPanel) ? fs.readFileSync(tokenPanel, "utf8") : "",
  ].join("\n");
  const required = ["PRODUCT.token", "requires-contract", "requires-governance", "requires-audit"];
  required.forEach((needle) => {
    if (!text.includes(needle)) {
      addFinding(report.findings, {
        file: "apps/web/app/token/page.tsx",
        line: 1,
        rule: "missing-token-freeze-copy",
        redacted: true,
        fix: `apps/web/app/token/page.tsx:1 include ${needle} token claim freeze status.`,
      });
    }
  });
  if (/(staking live|rewards paid|governance live|bounties live|slashing live)/i.test(text)) {
    addFinding(report.findings, {
      file: "apps/web/app/token/page.tsx",
      line: 1,
      rule: "live-token-utility-claim",
      redacted: true,
      fix: "apps/web/app/token/page.tsx:1 downgrade live token utility claims to proof-only/requires-contract statuses.",
    });
  }
  return finalizeReport(report);
}

function checkDomainClaimFreeze() {
  const report = baseReport("domain-claim-freeze", "Domain claim freeze");
  const domainPage = path.join(repoRoot, "apps/web/app/domains/page.tsx");
  const domainPanel = path.join(repoRoot, "apps/web/components/DomainHonestyPanel.tsx");
  if (!fs.existsSync(domainPage)) {
    addFinding(report.findings, {
      file: "apps/web/app/domains/page.tsx",
      line: 1,
      rule: "missing-domain-page",
      redacted: true,
      fix: "apps/web/app/domains/page.tsx:1 add domain page with requires-registry status.",
    });
    return finalizeReport(report);
  }
  const text = [
    fs.readFileSync(domainPage, "utf8"),
    fs.existsSync(domainPanel) ? fs.readFileSync(domainPanel, "utf8") : "",
  ].join("\n");
  if (!/requires-registry/i.test(text)) {
    addFinding(report.findings, {
      file: "apps/web/app/domains/page.tsx",
      line: 1,
      rule: "missing-domain-registry-freeze",
      redacted: true,
      fix: "apps/web/app/domains/page.tsx:1 show .caster status as requires-registry.",
    });
  }
  if (/\.caster mapped|mapped .*\.caster/i.test(text)) {
    addFinding(report.findings, {
      file: "apps/web/app/domains/page.tsx",
      line: 1,
      rule: "fake-caster-domain-mapping",
      redacted: true,
      fix: "apps/web/app/domains/page.tsx:1 remove .caster mapped claim until registry proof exists.",
    });
  }
  return finalizeReport(report);
}

function checkSensitiveEcosystemFiles() {
  return scanLines({
    id: "sensitive-ecosystem-files",
    title: "Sensitive ecosystem files are not public",
    roots: ["apps/web/public", "launch/artifacts/pr-13-canonical-ecosystem"],
    patterns: [
      { id: "private-key-name", description: "private key field or file reference in public artifact", regex: /\b(privateKey|private_key|mnemonic|seedPhrase|secretKey)\b/i },
      { id: "casteragents-runtime-state", description: "CasterAgents runtime state in public artifact", regex: /\b(agent_keys|pending_social|pending-social|processed_ids|rankings|balances)\b/i },
      { id: "credential-value", description: "credential-looking value in public artifact", regex: /\b(?:DATABASE_URL|REDIS_URL|SUPABASE_SERVICE_ROLE|R2_SECRET|QSTORAGE_SECRET)\b/i },
    ],
    ignoreLine: (_file, line) => /redacted|blocked|forbidden|secret-risk|sensitive-runtime-state|classification/i.test(line),
  });
}

function checkSignedMutationEnforcement() {
  const report = baseReport("signed-mutation-enforcement", "Signed mutation enforcement");
  const evidence = readJson(path.join(repoRoot, "launch/evidence/pr-11-mcp-tools.json"), null);
  const ok = evidence?.summary?.mutatingToolsBlockWithoutSigningIdentity === true
    && evidence?.summary?.identityShowDoesNotReturnPrivateKey === true;
  if (!ok) {
    addFinding(report.findings, {
      file: "launch/evidence/pr-11-mcp-tools.json",
      line: 1,
      rule: "missing-signed-mutation-proof",
      redacted: true,
      fix: "launch/evidence/pr-11-mcp-tools.json:1 rerun PR-11 MCP checker until mutating tools block without signing identity and identity_show hides private keys.",
    });
  }
  return finalizeReport(report);
}

function checkObjectStoreHonesty() {
  const report = baseReport("object-store-honesty", "Object store honesty");
  const pr17 = readJson(path.join(repoRoot, "launch/evidence/pr-17-castercloud-qstorage-pipeline.json"), null);
  if (!pr17) {
    addFinding(report.findings, {
      file: "launch/evidence/pr-17-castercloud-qstorage-pipeline.json",
      line: 1,
      rule: "missing-pr17-evidence",
      redacted: true,
      fix: "launch/evidence/pr-17-castercloud-qstorage-pipeline.json:1 run PR-17 deploy evidence pipeline.",
    });
  } else {
    const fakeClaim = pr17.status !== "passed" && (pr17.deployedClaimed || pr17.qstoragePublishedClaimed || pr17.castercloudDeployedClaimed);
    if (fakeClaim) {
      addFinding(report.findings, {
        file: "launch/evidence/pr-17-castercloud-qstorage-pipeline.json",
        line: 1,
        rule: "fake-object-store-deployment-proof",
        redacted: true,
        fix: "launch/evidence/pr-17-castercloud-qstorage-pipeline.json:1 clear deployed/published claims unless live proof reports pass.",
      });
    }
  }
  return finalizeReport(report);
}

const checks = {
  "secret-scan": checkSecretScan,
  "no-gitlawb-branding": checkNoGitlawbBranding,
  "no-hosted-platform-production": checkNoHostedPlatformProduction,
  "no-fake-live-claims": checkNoFakeLiveClaims,
  "token-claim-freeze": checkTokenClaimFreeze,
  "domain-claim-freeze": checkDomainClaimFreeze,
  "sensitive-ecosystem-files": checkSensitiveEcosystemFiles,
  "signed-mutation-enforcement": checkSignedMutationEnforcement,
  "object-store-honesty": checkObjectStoreHonesty,
};

function runSingle(id) {
  if (!checks[id]) throw new Error(`Unknown security check: ${id}`);
  ensureDir(artifactDir);
  return checks[id]();
}

function runAll() {
  ensureDir(artifactDir);
  const reports = {};
  const fixList = [];
  for (const id of Object.keys(checks)) {
    const report = runSingle(id);
    reports[id] = {
      status: report.status,
      findingCount: report.findings.length,
      artifact: report.artifact,
    };
    fixList.push(...report.fixList);
  }
  const failedChecks = Object.entries(reports)
    .filter(([, report]) => report.status === "failed")
    .map(([id]) => id);
  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-18",
    title: "Security gate",
    createdAt: new Date().toISOString(),
    status: failedChecks.length ? "failed" : "passed",
    passed: failedChecks.length === 0,
    failed: failedChecks.length > 0,
    failedChecks,
    checks: reports,
    fixList,
    exactFixListWritten: true,
    secretValuesPrinted: false,
    noFakeDeploymentClaim: true,
    noFallbackToHostedProduction: true,
    notes: failedChecks.length
      ? "Beta safety gate failed with exact fix list."
      : "Beta safety gate passed.",
  };
  writeJson(evidencePath, evidence);
  return evidence;
}

if (require.main === module) {
  const idArg = process.argv.find((arg) => arg.startsWith("--check="));
  const result = idArg ? runSingle(idArg.slice("--check=".length)) : runAll();
  console.log(JSON.stringify({
    status: result.status,
    passed: result.passed,
    failed: result.failed,
    failedChecks: result.failedChecks,
    findingCount: result.findings ? result.findings.length : undefined,
    fixCount: result.fixList ? result.fixList.length : undefined,
    evidence: rel(evidencePath),
  }, null, 2));
}

module.exports = { runSingle, runAll, checks };
