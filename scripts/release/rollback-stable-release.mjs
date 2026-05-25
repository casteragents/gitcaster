#!/usr/bin/env node
import { readJson } from "./_stable-check-utils.mjs";

const rollback = readJson("STABLE_ROLLBACK_MANIFEST.json", {});
if (!rollback.rollbackVersion || !Array.isArray(rollback.artifacts) || rollback.artifacts.length === 0) {
  console.error("[stable-rollback] BLOCKED: rollback manifest is incomplete.");
  process.exit(1);
}

console.log(`[stable-rollback] Roll back to ${rollback.rollbackVersion} using the signed rollback pipeline.`);
