#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const repoRoot = path.resolve(__dirname, "..", "..");
const evidenceDir = path.join(repoRoot, "launch", "evidence");
function readJson(name) { return JSON.parse(fs.readFileSync(path.join(evidenceDir, name), "utf8")); }
function writeJson(name, value) { fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`); }
function sha256(buf) { return `sha256:${crypto.createHash("sha256").update(buf).digest("hex")}`; }
function main() {
  const createdAt = new Date().toISOString();
  const bundle = readJson("gitcaster-production-rc-bundle.json");
  const checksums = readJson("gitcaster-production-rc-checksums.json");
  const findings = [];
  for (const item of checksums.files) {
    const rel = item.path.replace(/^launch\/evidence\//, "");
    const file = path.join(evidenceDir, rel);
    if (!fs.existsSync(file)) findings.push(`missing ${item.path}`);
    else if (sha256(fs.readFileSync(file)) !== item.checksum) findings.push(`checksum mismatch ${item.path}`);
  }
  if (bundle.canShipProduction !== false) findings.push("bundle canShipProduction must be false");
  const status = findings.length ? "failed" : "passed";
  writeJson("gitcaster-production-rc-integrity-check.json", {
    type: "gitcaster.production-rc.integrity-check.v1",
    status,
    createdAt,
    findings,
    checksumsVerified: findings.length === 0,
    sensitiveRuntimeValuesRead: false,
    imageBytesRead: false,
    canShipProduction: false
  });
  console.log(JSON.stringify({ status, findings: findings.length }, null, 2));
  if (status !== "passed") process.exitCode = 1;
}
main();
