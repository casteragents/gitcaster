#!/usr/bin/env node
import { readJson, statusFromEvidence } from "./_stable-check-utils.mjs";

const manifest = readJson("STABLE_RELEASE_MANIFEST.json", {});
const readiness = statusFromEvidence("launch/evidence/stable-final.json");

if (readiness.status !== "PASS" && readiness.status !== "GO") {
  console.error("[stable-publish] BLOCKED: stable-final evidence is not PASS.");
  process.exit(1);
}

if (manifest.channel !== "stable" || manifest.signed !== true || manifest.autoUpdateEnabled !== true) {
  console.error("[stable-publish] BLOCKED: stable manifest is not signed/updater-ready.");
  process.exit(1);
}

console.log("[stable-publish] Stable release gate passed. Publish through the signed release pipeline.");
