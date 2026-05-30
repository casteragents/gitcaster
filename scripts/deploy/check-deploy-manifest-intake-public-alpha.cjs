#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repoRoot = process.cwd();
const fixturePath = path.join(repoRoot, "examples/deploy/local-deploy-manifest.example.json");
const evidencePath = path.join(repoRoot, "launch/evidence/deploy-manifest-intake-public-alpha.json");
const publicJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-deploy-manifest-intake.json");

const requiredFiles = [
  "packages/deploy-manifests/package.json",
  "packages/deploy-manifests/src/types.ts",
  "packages/deploy-manifests/src/deploy-manifest.ts",
  "packages/deploy-manifests/src/deploy-manifest.test.ts",
  "examples/deploy/local-deploy-manifest.example.json",
  "docs-source/developer-layers/deploy-manifest-intake.md",
  "apps/web/app/open-source/deploy-manifest-intake/page.tsx",
  "apps/web/public/gitcaster-deploy-manifest-intake.md",
  "scripts/deploy/check-deploy-manifest-intake-public-alpha.cjs"
];

const blockers = [];
const warnings = [];

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function sha256File(rel) {
  return crypto.createHash("sha256").update(read(rel)).digest("hex");
}

for (const file of requiredFiles) {
  if (!exists(file)) blockers.push(`missing file: ${file}`);
}

let manifest = {};
if (!fs.existsSync(fixturePath)) {
  blockers.push("deploy manifest fixture missing");
} else {
  manifest = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

const modulePath = path.join(repoRoot, "packages/deploy-manifests/dist/index.js");
let validation = {
  status: "failed",
  blockers: ["deploy manifest package has not been built"],
  warnings: [],
  productionReadiness: "blocked_external",
  localDryRunAccepted: false,
  managedRuntimeRequired: false,
  requiredRuntimeDependencies: []
};

async function main() {
  if (fs.existsSync(modulePath)) {
    const mod = await import(pathToFileUrl(modulePath));
    validation = mod.validateDeployManifest(manifest);
  }

  if (validation.status !== "passed") blockers.push(...validation.blockers.map((blocker) => `validator: ${blocker}`));
  if (validation.productionReadiness !== "blocked_external") blockers.push("production readiness must be blocked_external");
  if (validation.localDryRunAccepted !== true) blockers.push("local dry-run manifest should be accepted");
  if (validation.managedRuntimeRequired !== false) blockers.push("managed runtime must not be required by public-alpha intake");
  if (validation.requiredRuntimeDependencies.length !== 0) blockers.push("native access path must not require retired runtime dependencies");

  const dependencyIds = new Set((manifest.dependencies || []).map((dependency) => dependency.id));
  for (const id of ["vercel", "cloudflare", "supabase", "redis", "r2", "qconsole"]) {
    if (!dependencyIds.has(id)) blockers.push(`missing dependency retirement marker: ${id}`);
  }

  const publicPage = exists("apps/web/app/open-source/deploy-manifest-intake/page.tsx")
    ? read("apps/web/app/open-source/deploy-manifest-intake/page.tsx")
    : "";
  if (/(production-ready|deployed to CasterCloud|QStorage verified|CasterCloud verified|\.caster mapped|public nodes online|multi-node replicated)/i.test(publicPage)) {
    blockers.push("public page contains unsupported live or production claim");
  }

  const packageSource = exists("packages/deploy-manifests/src/deploy-manifest.ts")
    ? read("packages/deploy-manifests/src/deploy-manifest.ts")
    : "";
  if (!packageSource.includes("target.mode must be local-dry-run")) blockers.push("validator must enforce local-dry-run mode");
  if (!packageSource.includes("secret-like manifest fields found")) blockers.push("validator must reject secret-like manifest fields");

  const artifactSummary = {
    type: "gitcaster.deploy-manifest-intake.public-alpha.v1",
    status: blockers.length === 0 ? "passed" : "failed",
    manifestId: manifest.id,
    appId: manifest.appId,
    localDryRunOnly: true,
    productionReadiness: "blocked_external",
    managedRuntimeRequired: false,
    requiredRuntimeDependencies: [],
    blockedCapabilities: manifest.blockedCapabilities || [],
    dependencyRetirement: manifest.dependencies || [],
    validation
  };

  fs.mkdirSync(path.dirname(publicJsonPath), { recursive: true });
  fs.writeFileSync(publicJsonPath, `${JSON.stringify(artifactSummary, null, 2)}\n`);

  const evidence = {
    type: "gitcaster.deploy-manifest-intake.evidence.v1",
    createdAt: new Date().toISOString(),
    status: blockers.length === 0 ? "passed" : "failed",
    package: "@gitcaster/deploy-manifests",
    fixture: "examples/deploy/local-deploy-manifest.example.json",
    website: "apps/web/app/open-source/deploy-manifest-intake/page.tsx",
    publicJson: "apps/web/public/gitcaster-deploy-manifest-intake.json",
    commandsRun: ["pnpm --filter @gitcaster/deploy-manifests check", "node scripts/deploy/check-deploy-manifest-intake-public-alpha.cjs"],
    blockers,
    warnings,
    validation,
    artifacts: [...requiredFiles, "apps/web/public/gitcaster-deploy-manifest-intake.json"].filter(exists).map((file) => ({
      path: file,
      sha256: sha256File(file)
    })),
    claims: {
      localDryRunOnly: true,
      managedRuntimeAvailable: false,
      nativeStoragePublished: false,
      nativeDomainMapped: false,
      custodyProvisioned: false,
      billingEnabled: false,
      rollbackVerified: false,
      productionReady: false
    },
    nextProofRequired: [
      "managed runtime deploy receipt and rollback proof",
      "native storage publish and read proof",
      "native domain registry and browser smoke proof",
      "custody signer reference and redacted receipt",
      "billing and abuse-control proof",
      "security audit and release-candidate proof"
    ]
  };

  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/deploy-manifest-intake-public-alpha.json", blockers }, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
}

function pathToFileUrl(filePath) {
  return `file:///${filePath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1:")}`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

