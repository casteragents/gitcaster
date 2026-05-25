#!/usr/bin/env node
import { check, finish, statusFromEvidence } from "./_stable-check-utils.mjs";

const evidence = [
  "launch/evidence/red-team.json",
  "launch/evidence/provider-key-vault.json",
  "launch/evidence/api-key-storage.json",
  "launch/evidence/privacy-firewall.json",
  "launch/evidence/mainnet-block.json",
  "launch/evidence/updater-bad-signature-rejection.json",
];

finish("stable-security.json", evidence.map((file) => {
  const status = statusFromEvidence(file);
  return check(status.status === "PASS", file, status.detail);
}));
