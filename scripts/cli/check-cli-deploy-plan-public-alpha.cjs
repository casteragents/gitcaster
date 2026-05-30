#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");

const repoRoot = process.cwd();
const localEvidenceRel = "launch/evidence/cli-deploy-plan-local-dry-run.json";
const evidenceRel = "launch/evidence/cli-deploy-plan-public-alpha.json";
const publicJsonRel = "apps/web/public/gitcaster-cli-deploy-plan.json";
const publicMarkdownRel = "apps/web/public/gitcaster-cli-deploy-plan.md";

const requiredFiles = [
  "apps/cli/package.json",
  "apps/cli/src/index.ts",
  "apps/cli/src/commands/deploy.ts",
  "apps/cli/src/node-shims.d.ts",
  "apps/cli/src/cli.test.ts",
  "packages/deploy-manifests/src/deploy-manifest.ts",
  "examples/deploy/local-deploy-manifest.example.json",
  "docs-source/developer-layers/cli.md",
  "docs-source/developer-layers/cli-deploy-plan.md",
  "apps/web/app/open-source/cli/page.tsx",
  "apps/web/app/open-source/cli-deploy-plan/page.tsx",
  publicMarkdownRel,
  "scripts/cli/check-cli-deploy-plan-public-alpha.cjs"
];

const expectedBlockedCapabilities = [
  "managed-runtime",
  "native-storage",
  "native-domain",
  "custody",
  "billing",
  "rollback",
  "production-readiness"
];

const expectedRetiredDependencies = ["vercel", "cloudflare", "supabase", "redis", "r2", "qconsole"];

const blockers = [];
const warnings = [];

function abs(rel) {
  return path.join(repoRoot, rel);
}

function exists(rel) {
  return fs.existsSync(abs(rel));
}

function read(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}

function sha256File(rel) {
  return crypto.createHash("sha256").update(read(rel)).digest("hex");
}

function hasSecretLikeText(value) {
  return /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+|mnemonic|seed phrase|api[_-]?key\s*[:=]|private[_-]?key\s*[:=]|token\s*[:=])/i.test(
    String(value)
  );
}

function pushBlocker(condition, message) {
  if (!condition) blockers.push(message);
}

async function main() {
for (const file of requiredFiles) {
  if (!exists(file)) blockers.push(`missing file: ${file}`);
}

if (exists("apps/cli/dist/index.js")) {
  try {
    const cli = await import(pathToFileURL(abs("apps/cli/dist/index.js")).href);
    const output = cli.runDeployPlanCommand([
      "--manifest",
      "examples/deploy/local-deploy-manifest.example.json",
      "--out",
      localEvidenceRel
    ]);
    if (!output.includes("status: public-alpha")) blockers.push("CLI deploy plan output must show public-alpha");
    if (!output.includes("productionReady: false")) blockers.push("CLI deploy plan output must reject production readiness");
  } catch (error) {
    blockers.push(`CLI deploy plan command failed: ${error.message}`);
  }
} else {
  blockers.push("apps/cli/dist/index.js missing; run pnpm run cli:check before this checker");
}

let localEvidence = {};
if (!exists(localEvidenceRel)) {
  blockers.push(`missing generated evidence: ${localEvidenceRel}`);
} else {
  try {
    localEvidence = JSON.parse(read(localEvidenceRel));
  } catch (error) {
    blockers.push(`invalid generated evidence JSON: ${error.message}`);
  }
}

pushBlocker(localEvidence.type === "gitcaster.deploy-plan.local-dry-run.v1", "deploy plan evidence type must be gitcaster.deploy-plan.local-dry-run.v1");
pushBlocker(localEvidence.status === "public-alpha", "deploy plan evidence status must be public-alpha");
pushBlocker(localEvidence.localDryRunOnly === true, "deploy plan evidence must be local dry-run only");
pushBlocker(localEvidence.validation?.status === "passed", "deploy plan manifest validation must pass");
pushBlocker(localEvidence.claims?.managedRuntimeAvailable === false, "managed runtime claim must remain false");
pushBlocker(localEvidence.claims?.nativeStoragePublished === false, "native storage claim must remain false");
pushBlocker(localEvidence.claims?.nativeDomainMapped === false, "native domain claim must remain false");
pushBlocker(localEvidence.claims?.custodyProvisioned === false, "custody claim must remain false");
pushBlocker(localEvidence.claims?.billingEnabled === false, "billing claim must remain false");
pushBlocker(localEvidence.claims?.rollbackVerified === false, "rollback claim must remain false");
pushBlocker(localEvidence.claims?.productionReady === false, "production readiness claim must remain false");

for (const capability of expectedBlockedCapabilities) {
  const match = localEvidence.blockedCapabilities?.find((item) => item.id === capability);
  pushBlocker(Boolean(match), `deploy plan missing blocked capability: ${capability}`);
  pushBlocker(match?.status === "blocked_external", `deploy plan ${capability} must be blocked_external`);
}

for (const dependency of expectedRetiredDependencies) {
  const match = localEvidence.retiredRuntimeDependencies?.find((item) => item.id === dependency);
  pushBlocker(Boolean(match), `deploy plan missing retired dependency marker: ${dependency}`);
  pushBlocker(match?.requiredRuntime === false, `deploy plan ${dependency} must not be required runtime`);
}

if (localEvidence.redactedManifest && hasSecretLikeText(JSON.stringify(localEvidence.redactedManifest))) {
  blockers.push("redacted manifest still contains secret-like text");
}

const helpSource = exists("apps/cli/src/commands/deploy.ts") ? read("apps/cli/src/commands/deploy.ts") : "";
pushBlocker(helpSource.includes("gc deploy plan"), "CLI deploy command help must include gc deploy plan");
pushBlocker(helpSource.includes("does not deploy, publish, bill, sign custody material, or touch external infrastructure"), "CLI deploy help must state external mutation is not performed");
if (/(production-ready|deployed to CasterCloud|QStorage verified|CasterCloud verified|\.caster mapped|public nodes online|multi-node replicated)/i.test(helpSource)) {
  blockers.push("CLI deploy source contains unsupported live or production claim");
}

const publicPage = exists("apps/web/app/open-source/cli-deploy-plan/page.tsx")
  ? read("apps/web/app/open-source/cli-deploy-plan/page.tsx")
  : "";
if (/(production-ready|deployed to CasterCloud|QStorage verified|CasterCloud verified|\.caster mapped|public nodes online|multi-node replicated)/i.test(publicPage)) {
  blockers.push("CLI deploy plan public page contains unsupported live or production claim");
}

const publicSummary = {
  type: "gitcaster.cli-deploy-plan.public-alpha.v1",
  status: blockers.length === 0 ? "passed" : "failed",
  command: "gc deploy plan",
  localEvidence: localEvidenceRel,
  localDryRunOnly: true,
  productionReadiness: "blocked_external",
  claims: {
    managedRuntimeAvailable: false,
    nativeStoragePublished: false,
    nativeDomainMapped: false,
    custodyProvisioned: false,
    billingEnabled: false,
    rollbackVerified: false,
    productionReady: false
  },
  blockedCapabilities: expectedBlockedCapabilities.map((id) => ({ id, status: "blocked_external" })),
  retiredRuntimeDependencies: expectedRetiredDependencies.map((id) => ({ id, requiredRuntime: false }))
};

fs.mkdirSync(path.dirname(abs(publicJsonRel)), { recursive: true });
fs.writeFileSync(abs(publicJsonRel), `${JSON.stringify(publicSummary, null, 2)}\n`);

const evidence = {
  type: "gitcaster.cli-deploy-plan.evidence.v1",
  createdAt: new Date().toISOString(),
  status: blockers.length === 0 ? "passed" : "failed",
  command: "gc deploy plan",
  package: "@gitcaster/cli",
  manifestPackage: "@gitcaster/deploy-manifests",
  localEvidence: localEvidenceRel,
  publicJson: publicJsonRel,
  website: "apps/web/app/open-source/cli-deploy-plan/page.tsx",
  commandsRun: [
    "pnpm run cli:check",
    "node apps/cli/dist/index.js deploy plan --manifest examples/deploy/local-deploy-manifest.example.json --out launch/evidence/cli-deploy-plan-local-dry-run.json",
    "node scripts/cli/check-cli-deploy-plan-public-alpha.cjs"
  ],
  blockers,
  warnings,
  validation: localEvidence.validation || null,
  artifacts: [...requiredFiles, localEvidenceRel, publicJsonRel].filter(exists).map((file) => ({
    path: file,
    sha256: sha256File(file)
  })),
  claims: publicSummary.claims,
  nextProofRequired: [
    "installer release receipt and user install smoke proof",
    "managed runtime deploy receipt and rollback proof",
    "native storage publish/read proof",
    "native domain registry and browser smoke proof",
    "custody signer reference with redacted receipt",
    "billing policy, abuse-control proof, security audit, and release-candidate evidence"
  ]
};

fs.mkdirSync(path.dirname(abs(evidenceRel)), { recursive: true });
fs.writeFileSync(abs(evidenceRel), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(JSON.stringify({ status: evidence.status, evidence: evidenceRel, blockers }, null, 2));
if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
