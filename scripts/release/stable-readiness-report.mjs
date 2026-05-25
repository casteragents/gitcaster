#!/usr/bin/env node
import { check, finish, statusFromEvidence } from "./_stable-check-utils.mjs";

const evidence = [
  "launch/evidence/stable-env.json",
  "launch/evidence/stable-artifacts.json",
  "launch/evidence/stable-updater.json",
  "launch/evidence/stable-manifest.json",
  "launch/evidence/stable-production-smoke.json",
  "launch/evidence/stable-security.json",
  "launch/evidence/stable-support.json",
  "launch/evidence/day-7.json",
];

finish("stable-final.json", evidence.map((file) => {
  const status = statusFromEvidence(file);
  return check(status.status === "PASS" || status.status === "GO", file, status.detail);
}));
