#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/casterdid-identity-public-smoke.json");
const publicJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-casterdid-identity-public-smoke.json");
const cacheBust = Date.now();
const targets = [
  {
    url: `https://casteragents.github.io/gitcaster/open-source/casterdid-identity/?v=${cacheBust}`,
    expectedText: "CasterDID identity for local GitCaster builders"
  },
  {
    url: `https://casteragents.github.io/gitcaster/gitcaster-casterdid-identity.json?v=${cacheBust}`,
    expectedText: "gitcaster.casterdid-identity.public-alpha.v1"
  },
  {
    url: `https://raw.githubusercontent.com/casteragents/gitcaster/main/launch/evidence/casterdid-identity-public-alpha.json?v=${cacheBust}`,
    expectedText: "gitcaster.casterdid-identity.evidence.v1"
  }
];

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const results = [];
  for (const target of targets) {
    try {
      const response = await fetch(target.url, { redirect: "follow" });
      const body = await response.text();
      results.push({ url: target.url, statusCode: response.status, ok: response.ok, expectedText: target.expectedText, containsExpectedText: body.includes(target.expectedText), bodySample: body.slice(0, 180) });
    } catch (error) {
      results.push({ url: target.url, statusCode: 0, ok: false, expectedText: target.expectedText, containsExpectedText: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  const passed = results.every((result) => result.ok && result.containsExpectedText);
  const report = {
    type: "gitcaster.casterdid-identity.public-smoke.v1",
    status: passed ? "passed" : "blocked_external",
    publicDeliveryOnly: true,
    managedRuntimeClaimed: false,
    createdAt: new Date().toISOString(),
    results,
    blockers: passed ? [] : ["GitHub Pages or raw GitHub public delivery smoke did not pass"]
  };
  writeJson(evidencePath, report);
  writeJson(publicJsonPath, report);
  console.log(JSON.stringify({ status: report.status, evidence: "launch/evidence/casterdid-identity-public-smoke.json", results: results.map(({ url, statusCode, ok, containsExpectedText }) => ({ url, statusCode, ok, containsExpectedText })) }, null, 2));
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  const blocker = error instanceof Error ? error.message : String(error);
  writeJson(evidencePath, { type: "gitcaster.casterdid-identity.public-smoke.v1", status: "failed", publicDeliveryOnly: true, managedRuntimeClaimed: false, createdAt: new Date().toISOString(), blockers: [blocker] });
  console.error(JSON.stringify({ status: "failed", blocker }, null, 2));
  process.exitCode = 1;
});
