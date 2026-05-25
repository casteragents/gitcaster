#!/usr/bin/env node
import { check, finish, statusFromEvidence } from "./_stable-check-utils.mjs";

const evidence = [
  "launch/evidence/production-vercel-env.json",
  "launch/evidence/production-db-migrations.json",
  "launch/evidence/production-api-platform.json",
  "launch/evidence/production-paid-billing.json",
  "launch/evidence/production-api-key-login.json",
  "launch/evidence/production-usage-cooldown.json",
  "launch/evidence/production-caster-rewards.json",
];

finish("stable-production-smoke.json", evidence.map((file) => {
  const status = statusFromEvidence(file);
  return check(status.status === "PASS", file, status.detail);
}));
