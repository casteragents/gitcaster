#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

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
const packageOnly = process.argv.includes("--package-only");
const evidencePath = path.join(repoRoot, "launch/evidence/pr-28-ecosystem-rc-import.json");
const publicRcPath = path.join(repoRoot, "apps/web/public/gitcaster-ecosystem.rc.json");
const docsRcPath = path.join(repoRoot, "docs/gitcaster-ecosystem.rc.json");
const canonicalPath = path.join(repoRoot, "apps/web/public/gitcaster-ecosystem.canonical.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const blockers = [];
for (const file of [publicRcPath, canonicalPath]) {
  if (!fs.existsSync(file)) blockers.push(`missing ${path.relative(repoRoot, file).replaceAll("\\", "/")}`);
}

let rc = null;
let canonical = null;
if (fs.existsSync(publicRcPath)) {
  rc = readJson(publicRcPath);
  if (rc.type !== "gitcaster.ecosystem.rc-directory.v1") blockers.push("RC directory type mismatch");
  if (rc.product !== "GitCaster") blockers.push("RC directory product must be GitCaster");
  if (rc.status !== "ecosystem-rc-ready") blockers.push("RC directory must stay ecosystem-rc-ready for preview-only import");
  if (rc.canShipProduction !== false) blockers.push("RC directory cannot ship production");
  if (!Array.isArray(rc.entries) || rc.entries.length === 0) blockers.push("RC directory entries missing");
  for (const entry of rc.entries || []) {
    if (entry.proof?.live || entry.proof?.deployed || entry.proof?.verified) blockers.push(`${entry.id} cannot claim live/deployed/verified proof`);
    if (entry.safety?.runtimeStatePublic || entry.safety?.secretsExposed || entry.safety?.imagesBundled) blockers.push(`${entry.id} exposes sensitive runtime state`);
    if (["live", "deployed", "verified", "production"].includes(entry.status)) blockers.push(`${entry.id} has forbidden status ${entry.status}`);
  }
}
if (fs.existsSync(canonicalPath)) {
  canonical = readJson(canonicalPath);
  if (canonical.type !== "gitcaster.ecosystem.canonical-manifest.v1") blockers.push("canonical manifest type mismatch");
  if (canonical.product !== "GitCaster") blockers.push("canonical manifest product must be GitCaster");
  if (canonical.status !== "preview") blockers.push("canonical manifest must stay preview");
}

if (!packageOnly && fs.existsSync(docsRcPath)) {
  const docsHash = hashFile(docsRcPath);
  const publicHash = hashFile(publicRcPath);
  if (docsHash !== publicHash) blockers.push("docs RC directory must match apps/web public RC directory");
}

const evidence = {
  type: "gitcaster.pr28.ecosystem-rc-import.evidence.v1",
  status: blockers.length ? "failed" : "passed",
  createdAt: new Date().toISOString(),
  packageOnly,
  rcDirectory: {
    path: "apps/web/public/gitcaster-ecosystem.rc.json",
    found: Boolean(rc),
    status: rc?.status ?? "missing",
    entriesTotal: rc?.entries?.length ?? 0,
    liveClaims: (rc?.entries ?? []).filter((entry) => entry.proof?.live).length,
    deployedClaims: (rc?.entries ?? []).filter((entry) => entry.proof?.deployed).length,
    verifiedClaims: (rc?.entries ?? []).filter((entry) => entry.proof?.verified).length,
    canShipProduction: rc?.canShipProduction === true
  },
  canonicalManifest: {
    path: "apps/web/public/gitcaster-ecosystem.canonical.json",
    found: Boolean(canonical),
    status: canonical?.status ?? "missing"
  },
  blockers,
  nextProof: [
    "Per-app GO approval proof",
    "QStorage publish proof",
    "CasterCloud deploy proof",
    "native .caster registry proof",
    "runtime endpoint smoke proof"
  ]
};

fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/pr-28-ecosystem-rc-import.json", blockers }, null, 2));
if (blockers.length) process.exitCode = 1;
