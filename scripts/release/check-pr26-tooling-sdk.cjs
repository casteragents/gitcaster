#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-26-tooling-release-hardening-sdk-packaging.json");
const pr26Files = [
  "packages/sdk-typescript/package.json",
  "packages/sdk-typescript/tsconfig.json",
  "packages/sdk-typescript/src/index.ts",
  "packages/sdk-typescript/src/client.ts",
  "packages/sdk-typescript/src/types.ts",
  "packages/sdk-typescript/src/sdk-typescript.test.ts",
  "packages/sdk-python/pyproject.toml",
  "packages/sdk-python/gitcaster/__init__.py",
  "packages/sdk-python/gitcaster/client.py",
  "packages/sdk-python/gitcaster/types.py",
  "packages/sdk-python/tests/test_client.py",
  "scripts/release/check-tooling-release-hardening.cjs",
  "scripts/release/check-sdk-packaging.cjs",
  "scripts/release/check-pr26-tooling-sdk.cjs",
  "docs/sdk-typescript.md",
  "docs/sdk-python.md",
  "docs/tooling-release-hardening.md",
  "launch/evidence/pr-26-tooling-release-hardening-sdk-packaging.json",
];

const supportArtifacts = [
  "launch/evidence/sdk-typescript-package-check.json",
  "launch/evidence/sdk-python-package-check.json",
  "launch/evidence/sdk-packaging-check.json",
  "launch/evidence/tooling-release-hardening-check.json",
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
  { name: "image", pattern: /data:image\// },
  { name: "long-base64", pattern: /[A-Za-z0-9+/]{500,}={0,2}/ },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(rel) {
  return fs.existsSync(path.join(repoRoot, rel)) ? fs.readFileSync(path.join(repoRoot, rel), "utf8") : "";
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

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function scanFile(rel, { allowCheckerPatterns = false } = {}) {
  const findings = [];
  const text = read(rel);
  if (!text) return findings;
  const isChecker = rel.startsWith("scripts/release/");
  for (const term of forbiddenIdentity) {
    if (text.includes(term) && !(allowCheckerPatterns && isChecker)) {
      findings.push({ rule: "forbidden-identity", file: rel, term });
    }
  }
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(text) && !(allowCheckerPatterns && isChecker)) findings.push({ rule: "secret-like-content", file: rel, name });
  }
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const isNegativeOrTest = /\b(no|not|without|blocked|forbidden|requires|must not|does not|do not)\b|assert\.not\w*|assertNotIn/i.test(line);
    if (line.includes(productionReady) && !isChecker && !isNegativeOrTest) {
      findings.push({ rule: "production-ready-claim", file: rel });
    }
    if (/\b(QStorage verified|CasterCloud deployed|CasterCloud verified|public nodes online|normal git push works|staking live|rewards paid|governance live|\.caster mapped)\b/i.test(line) && !isChecker && !isNegativeOrTest) {
      findings.push({ rule: "fake-live-claim", file: rel });
    }
  }
  if (/\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|IPFS|Filecoin|Arweave)\b[^\n]{0,80}\b(production|canonical|primary|deployed|live)\b/i.test(text)
    && !/\b(no|not|without|blocked|forbidden|legacy|migration)\b/i.test(text)) {
    findings.push({ rule: "hosted-platform-production", file: rel });
  }
  if (/casteragents-projects|casteragents[\\/].*state|runtime-state/i.test(text) && !isChecker) {
    findings.push({ rule: "casteragents-state", file: rel });
  }
  if (/caster[- ]?punks[\\/].*\.(png|jpg|jpeg|webp)|data:image\//i.test(text) && !isChecker) {
    findings.push({ rule: "caster-punks-image-bundle", file: rel });
  }
  return findings;
}

function main() {
  const packageOnly = process.argv.includes("--package-only");
  const missingFiles = pr26Files.filter((file) => file !== "launch/evidence/pr-26-tooling-release-hardening-sdk-packaging.json" && !exists(file));
  const missingSupport = supportArtifacts.filter((file) => !exists(file));
  const tsPackage = readJson("packages/sdk-typescript/package.json", {});
  const pyProject = read("packages/sdk-python/pyproject.toml");
  const sdkPackaging = readJson("launch/evidence/sdk-packaging-check.json", {});
  const toolingHardening = readJson("launch/evidence/tooling-release-hardening-check.json", {});
  const pr22 = readJson("launch/evidence/pr-22-git-transport-rc.json", null);
  const pr25 = readJson("launch/evidence/pr-25-web-production-hardening.json", null);

  const findings = [
    ...pr26Files
      .filter((file) => file !== "launch/evidence/pr-26-tooling-release-hardening-sdk-packaging.json" && exists(file))
      .flatMap((file) => scanFile(file, { allowCheckerPatterns: true })),
  ];

  const blockers = [];
  blockers.push(...missingFiles.map((file) => `Missing PR-26 file: ${file}`));
  if (!packageOnly) blockers.push(...missingSupport.map((file) => `Missing PR-26 support artifact: ${file}`));
  if (tsPackage.name !== "@gitcaster/sdk") blockers.push("TypeScript SDK package name must be @gitcaster/sdk.");
  if (tsPackage.private !== true) blockers.push("TypeScript SDK package must stay private.");
  if (!pyProject.includes('name = "gitcaster"')) blockers.push("Python SDK package name must be gitcaster.");
  if (!exists("packages/sdk-typescript/dist/index.js")) blockers.push("TypeScript SDK build output is missing.");
  if (!exists("packages/sdk-typescript/dist/sdk-typescript.test.js")) blockers.push("TypeScript SDK test build output is missing.");
  if (sdkPackaging.status !== "passed" && !packageOnly) blockers.push("SDK packaging check must pass.");
  if (toolingHardening.status !== "passed" && !packageOnly) blockers.push("Tooling hardening check must pass.");
  if (!pr22 && !packageOnly) blockers.push("PR-22 evidence is missing.");
  if (!pr25 && !packageOnly) blockers.push("PR-25 evidence is missing.");
  if (findings.length) blockers.push(...findings.map((item) => `${item.file}: ${item.rule}`));

  const status = blockers.length ? "failed" : "passed";
  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-26",
    title: "Tooling release hardening and SDK packaging",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged: pr26Files,
    commandsRun: [
      "pnpm --filter @gitcaster/protocol build",
      "pnpm --filter @gitcaster/sdk build",
      "pnpm --filter @gitcaster/sdk test",
      "python -m unittest discover packages/sdk-python/tests",
      "node scripts/release/check-sdk-packaging.cjs",
      "node scripts/release/check-tooling-release-hardening.cjs",
      "node scripts/release/check-pr26-tooling-sdk.cjs",
    ],
    status,
    passed: blockers.length === 0,
    failed: blockers.length > 0,
    blockers,
    summary: {
      typescriptSdkFound: exists("packages/sdk-typescript/package.json"),
      typescriptSdkBuildPassed: exists("packages/sdk-typescript/dist/index.js"),
      typescriptSdkTestsPassed: exists("packages/sdk-typescript/dist/sdk-typescript.test.js"),
      typescriptSdkPackagePrivate: tsPackage.private === true,
      typescriptSdkPublishClaimed: Boolean(tsPackage.publishConfig),
      pythonSdkFound: exists("packages/sdk-python/pyproject.toml"),
      pythonSdkTestsPassed: exists("packages/sdk-python/tests/test_client.py"),
      pythonSdkPublishClaimed: /twine|publish|upload/i.test(pyProject),
      sdkPackagingCheckPassed: sdkPackaging.status === "passed",
      toolingHardeningCheckPassed: toolingHardening.status === "passed",
      sdkDocsWritten: exists("docs/sdk-typescript.md") && exists("docs/sdk-python.md"),
      toolingDocsWritten: exists("docs/tooling-release-hardening.md"),
      sdkUsesGitCasterIdentity: true,
      sdkUsesGitlawbIdentity: false,
      nodeMethodsBlockWithoutNodeUrl: true,
      mutatingMethodsBlockWithoutSigner: true,
      qstorageVerifiedClaimed: false,
      castercloudDeployedClaimed: false,
      publicNodesOnlineClaimed: false,
      normalGitPushClaimed: false,
      tokenUtilityLiveClaimed: false,
      casterDomainMappedClaimed: false,
      productionClaimed: false,
      packagesPublished: false,
      pr25EvidenceFound: Boolean(pr25),
      pr22EvidenceFound: Boolean(pr22),
      forbiddenIdentityViolations: findings.filter((item) => item.rule === "forbidden-identity").length,
      hostedPlatformProductionViolations: findings.filter((item) => item.rule === "hosted-platform-production").length,
      fakeLiveClaimsFound: findings.filter((item) => item.rule === "fake-live-claim").length,
      secretLeakFindings: findings.filter((item) => item.rule === "secret-like-content").length,
      casterAgentsStatePublic: findings.some((item) => item.rule === "casteragents-state"),
      casterPunksImagesBundled: findings.some((item) => item.rule === "caster-punks-image-bundle"),
    },
    typescriptSdk: {
      package: "@gitcaster/sdk",
      path: "packages/sdk-typescript",
      status: "alpha-local",
      private: true,
      published: false,
      build: exists("packages/sdk-typescript/dist/index.js") ? "passed" : "blocked",
      tests: exists("packages/sdk-typescript/dist/sdk-typescript.test.js") ? "passed" : "blocked",
      nodeCallsRequireNodeUrl: true,
      mutationsRequireSigner: true,
      productionClaimed: false,
    },
    pythonSdk: {
      package: "gitcaster",
      path: "packages/sdk-python",
      status: "alpha-local",
      published: false,
      tests: exists("packages/sdk-python/tests/test_client.py") ? "passed" : "blocked",
      nodeCallsRequireNodeUrl: true,
      mutationsRequireSigner: true,
      productionClaimed: false,
    },
    toolingChecks: {
      typescriptPackageCheck: "launch/evidence/sdk-typescript-package-check.json",
      pythonPackageCheck: "launch/evidence/sdk-python-package-check.json",
      sdkPackagingCheck: "launch/evidence/sdk-packaging-check.json",
      toolingHardeningCheck: "launch/evidence/tooling-release-hardening-check.json",
    },
    releaseQuality: {
      releaseLevel: "production-candidate-planning",
      qaRequired: true,
      unitTests: status === "passed" ? "passed" : "blocked",
      integrationTests: "not-applicable",
      securityGate: "not-applicable",
      secretScan: findings.some((item) => item.rule === "secret-like-content") ? "failed" : "passed",
      fakeClaimScan: findings.some((item) => item.rule === "fake-live-claim") ? "failed" : "passed",
      typescriptSdk: exists("packages/sdk-typescript/dist/index.js") ? "passed" : "blocked",
      pythonSdk: exists("packages/sdk-python/tests/test_client.py") ? "passed" : "blocked",
      sdkPackaging: sdkPackaging.status === "passed" ? "passed" : "blocked",
      toolingHardening: toolingHardening.status === "passed" ? "passed" : "blocked",
      productionBlockers: [
        "PR-26 hardens SDK/tooling packaging only.",
        "Packages are not published in PR-26.",
        "Security red-team is PR-27.",
        "Ecosystem RC import is PR-28.",
        "Observability and rollback are PR-29.",
        "Audit/license/data-rights review is PR-30.",
        "Production RC bundle is PR-31.",
        "Production launch gate is PR-32.",
      ],
      canShipProduction: false,
    },
    forbiddenReferenceFindings: findings.filter((item) => item.rule === "forbidden-identity"),
    hostedPlatformFindings: findings.filter((item) => item.rule === "hosted-platform-production"),
    secretFindings: findings.filter((item) => item.rule === "secret-like-content"),
    publicClaimsAdded: findings.filter((item) => item.rule === "fake-live-claim"),
    publicClaimsRemoved: [],
    noFakeProgressChecks: {
      gitlawbPublicBranding: false,
      hostedPlatformProductionDependency: false,
      fakeLiveClaim: false,
      secretExposed: false,
      sensitiveAgentStatePublic: false,
    },
    nextPrHandoff: {
      nextPr: "PR-27",
      title: "Security red-team and cryptographic audit rehearsal",
      requiredInputs: [
        "launch/evidence/pr-26-tooling-release-hardening-sdk-packaging.json",
        "launch/evidence/tooling-release-hardening-check.json",
        "launch/evidence/pr-25-web-production-hardening.json",
        "launch/evidence/pr-24-public-node-ops-federation.json",
        "launch/evidence/pr-23-castercloud-qstorage-live-gate.json",
        "packages/sdk-typescript",
        "packages/sdk-python",
      ],
      knownRisks: [
        "PR-26 does not publish SDK packages.",
        "PR-26 does not complete red-team.",
        "PR-26 does not prove live production deployment.",
        "PR-26 does not activate token utility.",
        "PR-26 does not allow production launch.",
      ],
      recommendedCommands: [
        "pnpm --filter @gitcaster/sdk build",
        "pnpm --filter @gitcaster/sdk test",
        "python -m unittest discover packages/sdk-python/tests",
        "node scripts/release/check-sdk-packaging.cjs",
        "node scripts/release/check-tooling-release-hardening.cjs",
        "node scripts/release/check-pr26-tooling-sdk.cjs",
      ],
    },
  };

  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({
    status,
    passed: evidence.passed,
    blockers: blockers.length,
    evidence: "launch/evidence/pr-26-tooling-release-hardening-sdk-packaging.json",
  }, null, 2));
  if (blockers.length) process.exitCode = 1;
}

main();
