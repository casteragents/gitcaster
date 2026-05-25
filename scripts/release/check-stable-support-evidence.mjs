#!/usr/bin/env node
import { check, finish, statusFromEvidence } from "./_stable-check-utils.mjs";

const evidence = [
  "launch/evidence/support-redaction.json",
  "launch/evidence/support-routes.json",
  "launch/evidence/incident-mode.json",
  "launch/evidence/review-patch-audit.json",
];

finish("stable-support.json", evidence.map((file) => {
  const status = statusFromEvidence(file);
  return check(status.status === "PASS", file, status.detail);
}));
