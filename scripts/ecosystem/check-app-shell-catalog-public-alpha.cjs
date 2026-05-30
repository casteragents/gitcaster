#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (current !== path.dirname(current)) {
    const pkg = path.join(current, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        if (JSON.parse(fs.readFileSync(pkg, "utf8")).name === "gitcaster-public") return current;
      } catch {}
    }
    current = path.dirname(current);
  }
  throw new Error("gitcaster-public repo root not found");
}

const repoRoot = findRepoRoot(process.cwd());
const distModule = path.join(repoRoot, "packages/ecosystem/dist/app-shell-catalog.js");
const rcPath = path.join(repoRoot, "apps/web/public/gitcaster-ecosystem.rc.json");
const fixturePath = path.join(repoRoot, "examples/app-shells/gitcaster-app-shell-catalog.local.json");
const publicCatalogPath = path.join(repoRoot, "apps/web/public/gitcaster-app-shell-catalog.json");
const evidencePath = path.join(repoRoot, "launch/evidence/app-shell-catalog-public-hardening-source.json");

function rel(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function containsForbiddenClaim(value) {
  return /\b(live|production-ready|production ready|deployed|audited|unblocked)\b/i.test(JSON.stringify(value));
}

(async () => {
  const blockers = [];
  for (const file of [distModule, rcPath, fixturePath]) {
    if (!fs.existsSync(file)) blockers.push(`missing ${rel(file)}`);
  }

  let catalog = null;
  let rc = null;
  let fixture = null;
  if (fs.existsSync(rcPath)) rc = readJson(rcPath);
  if (fs.existsSync(fixturePath)) fixture = readJson(fixturePath);
  if (fs.existsSync(distModule) && rc) {
    const mod = await import(pathToFileURL(distModule).href);
    catalog = mod.createAppShellCatalog({ directory: rc, createdAt: rc.createdAt });
    blockers.push(...mod.validateAppShellCatalog(catalog));
  }

  if (fixture) {
    if (fixture.type !== "gitcaster.app-shell-catalog.fixture.v1") blockers.push("app-shell fixture type mismatch");
    if (fixture.status !== "public-alpha") blockers.push("app-shell fixture must be public-alpha");
    if (fixture.scope !== "local-preview-only") blockers.push("app-shell fixture scope must be local-preview-only");
    if (fixture.canShipProduction !== false) blockers.push("app-shell fixture cannot ship production");
    if (fixture.dependencyRisk?.managedRuntime !== "blocked_external") blockers.push("fixture managed runtime risk must be blocked_external");
    if (fixture.dependencyRisk?.nativeStorage !== "blocked_external") blockers.push("fixture native storage risk must be blocked_external");
    if (fixture.dependencyRisk?.nativeDomain !== "blocked_external") blockers.push("fixture native domain risk must be blocked_external");
    if (containsForbiddenClaim(fixture.publicClaims)) blockers.push("fixture public claims include unsupported stronger language");
  }

  if (catalog) {
    if (!catalog.entries.some((entry) => entry.id === "caster-claim-miniapp" && entry.kind === "miniapp-shell")) {
      blockers.push("catalog must include Caster Claim miniapp shell");
    }
    if (catalog.entries.some((entry) => entry.proof.nativeDeployment || entry.proof.qstoragePublished || entry.proof.casterDomainMapped || entry.proof.runtimeEndpointLive)) {
      blockers.push("catalog includes unsupported runtime/native deployment proof");
    }
    if (catalog.entries.some((entry) => containsForbiddenClaim(entry.publicClaims))) {
      blockers.push("catalog public claims include unsupported stronger language");
    }
    fs.writeFileSync(publicCatalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }

  const artifactHashes = [rcPath, fixturePath, publicCatalogPath]
    .filter((file) => fs.existsSync(file))
    .map((file) => ({ path: rel(file), sha256: hashFile(file) }));
  const evidence = {
    type: "gitcaster.app-shell-catalog.public-hardening.evidence.v1",
    status: blockers.length ? "failed" : "passed",
    createdAt: new Date().toISOString(),
    title: "GitCaster app and miniapp shell catalog hardening",
    publicArtifacts: [
      "packages/ecosystem/src/app-shell-catalog.ts",
      "examples/app-shells/gitcaster-app-shell-catalog.local.json",
      "apps/web/public/gitcaster-app-shell-catalog.json",
      "apps/web/app/open-source/app-shell-catalog/page.tsx",
      "docs-source/developer-layers/app-shell-catalog.md"
    ],
    commandsRun: [
      "pnpm --filter @gitcaster/ecosystem build",
      "pnpm --filter @gitcaster/ecosystem test",
      "node scripts/ecosystem/check-pr28-ecosystem-rc.cjs",
      "node scripts/ecosystem/check-app-shell-catalog-public-alpha.cjs"
    ],
    summary: {
      entriesTotal: catalog?.summary.entriesTotal ?? 0,
      miniappShells: catalog?.summary.miniappShells ?? 0,
      localFixtures: catalog?.summary.localFixtures ?? 0,
      blockedNativeDeployments: catalog?.summary.blockedNativeDeployments ?? 0,
      blockedManagedRuntimes: catalog?.summary.blockedManagedRuntimes ?? 0,
      noLiveRuntimeClaims: catalog ? !catalog.entries.some((entry) => entry.proof.runtimeEndpointLive) : false,
      noNativeDeploymentClaims: catalog ? !catalog.entries.some((entry) => entry.proof.nativeDeployment) : false,
      noQStoragePublishClaims: catalog ? !catalog.entries.some((entry) => entry.proof.qstoragePublished) : false,
      canShipProduction: catalog?.canShipProduction === true
    },
    dependencyRiskLabels: catalog
      ? [...new Set(catalog.entries.flatMap((entry) => Object.values(entry.dependencyRisk)))].sort()
      : [],
    artifactHashes,
    blockers,
    nextProof: [
      "Public native storage publish proof",
      "native .caster route proof",
      "managed runtime endpoint proof",
      "security review proof per app shell",
      "rollback proof for live deployment"
    ]
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: evidence.status, evidence: rel(evidencePath), catalog: rel(publicCatalogPath), blockers }, null, 2));
  if (blockers.length) process.exitCode = 1;
})().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
