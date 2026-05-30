#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repoRoot = process.cwd();
const fixtureRel = "examples/app-shells/caster-intelligence.local-shell.json";
const catalogRel = "apps/web/public/gitcaster-app-shell-catalog.json";
const ecosystemPageRel = "apps/web/app/ecosystem/caster-intelligence/page.tsx";
const openSourcePageRel = "apps/web/app/open-source/caster-intelligence-preview/page.tsx";
const publicJsonRel = "apps/web/public/gitcaster-caster-intelligence-preview.json";
const publicMarkdownRel = "apps/web/public/gitcaster-caster-intelligence-preview.md";
const evidenceRel = "launch/evidence/caster-intelligence-preview-public-alpha.json";

const expectedBlockedCapabilities = [
  "source-contents-publication",
  "native-storage",
  "native-domain",
  "managed-runtime",
  "runtime-endpoint",
  "rollback",
  "production-readiness"
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
  return ["docs", "apps/web/out"].map(abs).find((candidate) => fs.existsSync(candidate)) || null;
}

function routeToHtml(staticRoot, route) {
  const cleanRoute = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return cleanRoute ? path.join(staticRoot, cleanRoute, "index.html") : path.join(staticRoot, "index.html");
}

function hasSecretLikeText(value) {
  return /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+|mnemonic|seed phrase|api[_-]?key\s*[:=]|private[_-]?key\s*[:=]|token\s*[:=])/i.test(String(value));
}

function hasUnsupportedClaim(value) {
  return /(production-ready|deployed to CasterCloud|QStorage verified|CasterCloud verified|\.caster mapped|staking live|rewards paid|governance live|public nodes online|multi-node replicated|normal git push works|source contents published|runtime endpoint live)/i.test(String(value));
}

function expect(condition, blockers, message) {
  if (!condition) blockers.push(message);
}

const blockers = [];
for (const file of [fixtureRel, catalogRel, ecosystemPageRel, openSourcePageRel]) {
  if (!exists(file)) blockers.push(`missing file: ${file}`);
}

let fixture = {};
let catalog = { entries: [] };
try {
  if (exists(fixtureRel)) fixture = readJson(fixtureRel);
} catch (error) {
  blockers.push(`invalid fixture JSON: ${error.message}`);
}
try {
  if (exists(catalogRel)) catalog = readJson(catalogRel);
} catch (error) {
  blockers.push(`invalid catalog JSON: ${error.message}`);
}

const entry = Array.isArray(catalog.entries) ? catalog.entries.find((item) => item.id === "caster-intelligence") : null;
expect(fixture.type === "gitcaster.caster-intelligence.local-shell.v1", blockers, "fixture type mismatch");
expect(fixture.status === "public-alpha", blockers, "fixture status must be public-alpha");
expect(fixture.scope === "local-preview-shell-only", blockers, "fixture scope must be local-preview-shell-only");
expect(fixture.claims?.localPreviewShell === true, blockers, "fixture must claim local preview shell only");
expect(fixture.claims?.sourceContentsPublished === false, blockers, "fixture cannot publish source contents");
expect(fixture.claims?.nativeStoragePublished === false, blockers, "fixture cannot claim native storage publication");
expect(fixture.claims?.nativeDomainMapped === false, blockers, "fixture cannot claim native domain mapping");
expect(fixture.claims?.managedRuntimeAvailable === false, blockers, "fixture cannot claim managed runtime");
expect(fixture.claims?.runtimeEndpointLive === false, blockers, "fixture cannot claim runtime endpoint");
expect(fixture.claims?.rollbackVerified === false, blockers, "fixture cannot claim rollback verification");
expect(fixture.claims?.productionReady === false, blockers, "fixture cannot claim production readiness");
expect(fixture.dataRights?.provenanceRequired === true, blockers, "fixture must require provenance review");
expect(fixture.dataRights?.sourceContentsPublished === false, blockers, "data rights must keep source contents private");
expect(fixture.dataRights?.indexOnlyAllowed === true, blockers, "fixture must mark index-only allowed");
expect(fixture.dataRights?.runtimeStatePublic === false, blockers, "fixture cannot publish runtime state");
expect(fixture.dataRights?.secretsExposed === false, blockers, "fixture cannot expose secrets");
expect(fixture.canShipProduction === false, blockers, "fixture cannot ship production");
expect(entry?.status === "public-alpha", blockers, "catalog entry must be public-alpha");
expect(entry?.localPreviewPath === "/ecosystem/caster-intelligence", blockers, "catalog entry must use dedicated preview route");
expect(entry?.manifestPath === fixtureRel, blockers, "catalog entry must point to fixture");
expect(entry?.proof?.localFixture === true, blockers, "catalog entry must mark local fixture proof");
expect(entry?.proof?.nativeDeployment === false, blockers, "catalog entry cannot claim native deployment");
expect(entry?.proof?.qstoragePublished === false, blockers, "catalog entry cannot claim native storage publication");
expect(entry?.proof?.casterDomainMapped === false, blockers, "catalog entry cannot claim native domain mapping");
expect(entry?.proof?.runtimeEndpointLive === false, blockers, "catalog entry cannot claim runtime endpoint");

const fixtureText = JSON.stringify(fixture);
const entryText = JSON.stringify(entry ?? {});
for (const [label, text] of [["fixture", fixtureText], ["catalog entry", entryText], ["ecosystem page", exists(ecosystemPageRel) ? read(ecosystemPageRel) : ""], ["open-source page", exists(openSourcePageRel) ? read(openSourcePageRel) : ""]]) {
  if (hasSecretLikeText(text)) blockers.push(`${label} contains secret-like text`);
  if (hasUnsupportedClaim(text)) blockers.push(`${label} contains unsupported stronger claim`);
}

const staticRoot = findStaticRoot();
const routeSmokes = [];
if (!staticRoot) {
  blockers.push("static export root missing: docs or apps/web/out");
} else {
  for (const route of ["/ecosystem/caster-intelligence", "/open-source/caster-intelligence-preview"]) {
    const htmlPath = routeToHtml(staticRoot, route);
    const htmlExists = fs.existsSync(htmlPath);
    const html = htmlExists ? fs.readFileSync(htmlPath, "utf8") : "";
    const expectedText = route.includes("open-source") ? "Caster Intelligence preview shell" : "Caster Intelligence";
    const passed = htmlExists && html.includes(expectedText) && !hasSecretLikeText(html) && !hasUnsupportedClaim(html);
    routeSmokes.push({ route, html: htmlExists ? rel(htmlPath) : rel(htmlPath), expectedText, status: passed ? "passed" : "failed" });
    if (!passed) blockers.push(`static preview smoke failed for ${route}`);
  }
}

const publicSummary = {
  type: "gitcaster.caster-intelligence-preview.public-alpha.v1",
  status: blockers.length === 0 ? "passed" : "failed",
  localPreviewOnly: true,
  createdAt: new Date().toISOString(),
  fixture: fixtureRel,
  catalog: catalogRel,
  claims: {
    sourceContentsPublished: false,
    nativeStoragePublished: false,
    nativeDomainMapped: false,
    managedRuntimeAvailable: false,
    runtimeEndpointLive: false,
    rollbackVerified: false,
    productionReady: false
  },
  dataRights: {
    provenanceRequired: true,
    sourceContentsPublished: false,
    indexOnlyAllowed: true,
    runtimeStatePublic: false,
    secretsExposed: false
  },
  blockedCapabilities: expectedBlockedCapabilities.map((id) => ({ id, status: "blocked_external" })),
  routeSmokes
};

fs.mkdirSync(path.dirname(abs(publicJsonRel)), { recursive: true });
fs.writeFileSync(abs(publicJsonRel), `${JSON.stringify(publicSummary, null, 2)}\n`);

const markdown = `# Caster Intelligence Preview Shell

Status: public-alpha, local preview shell only.

This proof publishes redacted shell metadata and static page checks for Caster
Intelligence. It does not publish source contents, runtime state, managed
endpoints, native storage, native domains, rollback proof, or production
readiness.

## Checked Routes

${routeSmokes.map((item) => `- ${item.route}: ${item.status}`).join("\n")}

## Verification

\`\`\`bash
pnpm run caster-intelligence-preview:check
pnpm run secret-scan
\`\`\`

## Still Blocked

${expectedBlockedCapabilities.map((item) => `- ${item}: blocked_external`).join("\n")}
`;
fs.writeFileSync(abs(publicMarkdownRel), `${markdown}\n`);

const evidence = {
  type: "gitcaster.caster-intelligence-preview.evidence.v1",
  createdAt: new Date().toISOString(),
  status: blockers.length === 0 ? "passed" : "failed",
  title: "Caster Intelligence public-alpha local preview shell",
  localPreviewOnly: true,
  fixture: fixtureRel,
  catalog: catalogRel,
  publicJson: publicJsonRel,
  publicMarkdown: publicMarkdownRel,
  website: ecosystemPageRel,
  openSourcePage: openSourcePageRel,
  commandsRun: [
    "pnpm run app-shell-preview-smoke:check",
    "node scripts/ecosystem/check-caster-intelligence-preview-public-alpha.cjs"
  ],
  claims: publicSummary.claims,
  dataRights: publicSummary.dataRights,
  routeSmokes,
  blockers,
  artifacts: [fixtureRel, catalogRel, ecosystemPageRel, openSourcePageRel, publicJsonRel, publicMarkdownRel]
    .filter(exists)
    .map((file) => ({ path: file, sha256: sha256File(file) })),
  nextProofRequired: [
    "source rights review proof",
    "public user browser smoke proof",
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
