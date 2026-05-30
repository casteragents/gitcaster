#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repoRoot = process.cwd();
const catalogRel = "apps/web/public/gitcaster-app-shell-catalog.json";
const fixtureRel = "examples/app-shells/gitcaster-app-shell-catalog.local.json";
const publicJsonRel = "apps/web/public/gitcaster-app-shell-local-preview-smoke.json";
const publicMarkdownRel = "apps/web/public/gitcaster-app-shell-local-preview-smoke.md";
const evidenceRel = "launch/evidence/app-shell-local-preview-smoke-public-alpha.json";

const requiredFiles = [
  catalogRel,
  fixtureRel,
  "apps/web/app/ecosystem/page.tsx",
  "apps/web/app/ecosystem/caster-claim-miniapp/page.tsx",
  "apps/web/app/open-source/app-shell-catalog/page.tsx",
  "apps/web/app/open-source/app-shell-local-preview-smoke/page.tsx",
  "scripts/ecosystem/check-app-shell-catalog-public-alpha.cjs",
  "scripts/ecosystem/check-app-shell-local-preview-smoke-public-alpha.cjs",
  "docs-source/developer-layers/app-shell-local-preview-smoke.md"
];

const expectedBlockedCapabilities = [
  "native-storage",
  "native-domain",
  "managed-runtime",
  "runtime-endpoint",
  "production-readiness",
  "rollback"
];

function abs(rel) {
  return path.join(repoRoot, rel);
}

function exists(rel) {
  return fs.existsSync(abs(rel));
}

function read(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

function sha256File(rel) {
  return crypto.createHash("sha256").update(read(rel)).digest("hex");
}

function rel(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function findStaticRoot() {
  const candidates = ["docs", "apps/web/out"];
  return candidates.map((candidate) => abs(candidate)).find((candidate) => fs.existsSync(candidate)) || null;
}

function routeToHtml(staticRoot, route) {
  const cleanRoute = route.split("#")[0].replace(/^\/+/, "").replace(/\/+$/, "");
  return cleanRoute ? path.join(staticRoot, cleanRoute, "index.html") : path.join(staticRoot, "index.html");
}

function hasSecretLikeText(value) {
  return /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+|mnemonic|seed phrase|api[_-]?key\s*[:=]|private[_-]?key\s*[:=]|token\s*[:=])/i.test(
    String(value)
  );
}

function hasUnsupportedClaim(value) {
  return /(production-ready|deployed to CasterCloud|QStorage verified|CasterCloud verified|\.caster mapped|staking live|rewards paid|governance live|public nodes online|multi-node replicated|normal git push works)/i.test(
    String(value)
  );
}

function pushBlocker(condition, blockers, message) {
  if (!condition) blockers.push(message);
}

const blockers = [];
for (const file of requiredFiles) {
  if (!exists(file)) blockers.push(`missing file: ${file}`);
}

let catalog = { entries: [], summary: {} };
let fixture = {};
if (exists(catalogRel)) {
  try {
    catalog = readJson(catalogRel);
  } catch (error) {
    blockers.push(`invalid catalog JSON: ${error.message}`);
  }
}
if (exists(fixtureRel)) {
  try {
    fixture = readJson(fixtureRel);
  } catch (error) {
    blockers.push(`invalid fixture JSON: ${error.message}`);
  }
}

pushBlocker(catalog.type === "gitcaster.app-shell-catalog.v1", blockers, "catalog type must be gitcaster.app-shell-catalog.v1");
pushBlocker(catalog.status === "public-alpha", blockers, "catalog status must be public-alpha");
pushBlocker(catalog.canShipProduction === false, blockers, "catalog cannot ship production");
pushBlocker(fixture.type === "gitcaster.app-shell-catalog.fixture.v1", blockers, "fixture type must be gitcaster.app-shell-catalog.fixture.v1");
pushBlocker(fixture.scope === "local-preview-only", blockers, "fixture scope must be local-preview-only");
pushBlocker(fixture.canShipProduction === false, blockers, "fixture cannot ship production");

for (const entry of catalog.entries || []) {
  pushBlocker(entry.redacted === true, blockers, `${entry.id} must be redacted`);
  pushBlocker(entry.proof?.nativeDeployment === false, blockers, `${entry.id} native deployment claim must be false`);
  pushBlocker(entry.proof?.qstoragePublished === false, blockers, `${entry.id} native storage claim must be false`);
  pushBlocker(entry.proof?.casterDomainMapped === false, blockers, `${entry.id} native domain claim must be false`);
  pushBlocker(entry.proof?.runtimeEndpointLive === false, blockers, `${entry.id} runtime endpoint claim must be false`);
  pushBlocker(entry.dependencyRisk?.nativeStorage === "blocked_external", blockers, `${entry.id} native storage risk must be blocked_external`);
  pushBlocker(entry.dependencyRisk?.nativeDomain === "blocked_external", blockers, `${entry.id} native domain risk must be blocked_external`);
  pushBlocker(entry.dependencyRisk?.managedRuntime === "blocked_external", blockers, `${entry.id} managed runtime risk must be blocked_external`);
  if (hasSecretLikeText(JSON.stringify(entry))) blockers.push(`${entry.id} contains secret-like text`);
  if (hasUnsupportedClaim(JSON.stringify(entry.publicClaims || []))) blockers.push(`${entry.id} contains unsupported public claim`);
  if (entry.manifestPath) pushBlocker(exists(entry.manifestPath), blockers, `${entry.id} manifest path missing: ${entry.manifestPath}`);
}

const staticRoot = findStaticRoot();
if (!staticRoot) blockers.push("static export root missing: docs or apps/web/out");

const routeSmokes = [];
if (staticRoot) {
  const fixtureRoutes = Array.isArray(fixture.localPreviewRoutes) ? fixture.localPreviewRoutes : [];
  for (const route of fixtureRoutes) {
    const htmlPath = routeToHtml(staticRoot, route);
    const htmlExists = fs.existsSync(htmlPath);
    const html = htmlExists ? fs.readFileSync(htmlPath, "utf8") : "";
    const expectedText = route === "/ecosystem/caster-claim-miniapp"
      ? "Caster Claim Miniapp"
      : route === "/open-source/app-shell-catalog"
        ? "App shell catalog"
        : "GitCaster ecosystem";
    const passed = htmlExists && html.includes(expectedText) && !hasSecretLikeText(html) && !hasUnsupportedClaim(html);
    routeSmokes.push({ route, html: htmlExists ? rel(htmlPath) : rel(htmlPath), expectedText, status: passed ? "passed" : "failed" });
    if (!passed) blockers.push(`local preview smoke failed for ${route}`);
  }

  for (const entry of catalog.entries || []) {
    const htmlPath = routeToHtml(staticRoot, entry.localPreviewPath || "/ecosystem");
    const htmlExists = fs.existsSync(htmlPath);
    const html = htmlExists ? fs.readFileSync(htmlPath, "utf8") : "";
    const passed = htmlExists && html.includes(entry.name) && !hasSecretLikeText(html) && !hasUnsupportedClaim(html);
    routeSmokes.push({
      route: entry.localPreviewPath,
      entryId: entry.id,
      html: htmlExists ? rel(htmlPath) : rel(htmlPath),
      expectedText: entry.name,
      status: passed ? "passed" : "failed"
    });
    if (!passed) blockers.push(`catalog entry preview smoke failed for ${entry.id}`);
  }
}

const publicSummary = {
  type: "gitcaster.app-shell-local-preview-smoke.public-alpha.v1",
  status: blockers.length === 0 ? "passed" : "failed",
  localPreviewOnly: true,
  createdAt: new Date().toISOString(),
  catalog: {
    path: catalogRel,
    entriesTotal: catalog.summary?.entriesTotal ?? 0,
    miniappShells: catalog.summary?.miniappShells ?? 0,
    localFixtures: catalog.summary?.localFixtures ?? 0
  },
  staticExport: {
    root: staticRoot ? rel(staticRoot) : null,
    routeSmokeCount: routeSmokes.length
  },
  claims: {
    nativeStoragePublished: false,
    nativeDomainMapped: false,
    managedRuntimeAvailable: false,
    runtimeEndpointLive: false,
    rollbackVerified: false,
    productionReady: false
  },
  blockedCapabilities: expectedBlockedCapabilities.map((id) => ({ id, status: "blocked_external" })),
  routeSmokes
};

fs.mkdirSync(path.dirname(abs(publicJsonRel)), { recursive: true });
fs.writeFileSync(abs(publicJsonRel), `${JSON.stringify(publicSummary, null, 2)}\n`);

const markdown = `# GitCaster App Shell Local Preview Smoke

Status: public-alpha, local preview only.

This proof checks the static GitCaster app and miniapp preview routes without
claiming native storage, native domains, managed runtime, rollback, or
production readiness.

## Checked Routes

${routeSmokes.map((item) => `- ${item.route}: ${item.status}`).join("\n")}

## Verification

\`\`\`bash
pnpm run app-shell-preview-smoke:check
pnpm run secret-scan
\`\`\`

## Still Blocked

${expectedBlockedCapabilities.map((item) => `- ${item}: blocked_external`).join("\n")}
`;
fs.writeFileSync(abs(publicMarkdownRel), `${markdown}\n`);

const evidence = {
  type: "gitcaster.app-shell-local-preview-smoke.evidence.v1",
  createdAt: new Date().toISOString(),
  status: blockers.length === 0 ? "passed" : "failed",
  title: "GitCaster app and miniapp local preview smoke",
  localPreviewOnly: true,
  catalog: catalogRel,
  fixture: fixtureRel,
  publicJson: publicJsonRel,
  publicMarkdown: publicMarkdownRel,
  website: "apps/web/app/open-source/app-shell-local-preview-smoke/page.tsx",
  commandsRun: [
    "pnpm run app-shell-catalog:check",
    "node scripts/ecosystem/check-app-shell-local-preview-smoke-public-alpha.cjs"
  ],
  claims: publicSummary.claims,
  routeSmokes,
  blockers,
  artifacts: [...requiredFiles, publicJsonRel, publicMarkdownRel].filter(exists).map((file) => ({
    path: file,
    sha256: sha256File(file)
  })),
  nextProofRequired: [
    "public user browser smoke proof",
    "per-shell security review proof",
    "native storage publish and read proof",
    "native domain route proof",
    "managed runtime endpoint proof",
    "rollback proof for live promotion"
  ]
};

fs.mkdirSync(path.dirname(abs(evidenceRel)), { recursive: true });
fs.writeFileSync(abs(evidenceRel), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(JSON.stringify({ status: evidence.status, evidence: evidenceRel, publicJson: publicJsonRel, blockers }, null, 2));
if (blockers.length > 0) process.exitCode = 1;
