#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const repoRoot = path.resolve(__dirname, "..", "..");
const evidenceDir = path.join(repoRoot, "launch", "evidence");
function readJson(name) { return JSON.parse(fs.readFileSync(path.join(evidenceDir, name), "utf8")); }
function writeJson(name, value) { fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`); }
function main() {
  const createdAt = new Date().toISOString();
  const bundle = readJson("gitcaster-production-rc-bundle.json");
  const blockers = readJson("gitcaster-production-rc-blockers.json");
  const verdict = blockers.blockers.length ? "no-ship-blocked" : "production-rc-ready-for-pr32";
  const preflight = {
    type: "gitcaster.production-rc.ship-no-ship-preflight.v1",
    verdict,
    createdAt,
    canClaimProductionRC: false,
    canProceedToPR32: false,
    canShipProduction: false,
    reason: blockers.blockers.length ? "Production RC has unresolved blockers." : "PR-32 is still required for launch decision.",
    shipAllowedClaims: bundle.shipAllowedClaims,
    shipBlockedClaims: bundle.shipBlockedClaims,
    launchBlockingBlockers: blockers.blockers,
    manualReviewRequired: blockers.blockers.filter((item) => /review|audit|rights|license/i.test(item)),
    nextRequiredProof: blockers.blockers
  };
  writeJson("gitcaster-ship-no-ship-preflight.json", preflight);
  console.log(JSON.stringify({ verdict, blockers: blockers.blockers.length, canShipProduction: false }, null, 2));
}
main();
