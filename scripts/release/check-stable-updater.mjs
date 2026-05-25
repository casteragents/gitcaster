#!/usr/bin/env node
import { check, finish, readJson, statusFromEvidence } from "./_stable-check-utils.mjs";

const manifest = readJson("STABLE_RELEASE_MANIFEST.json", {});
const badSignature = statusFromEvidence("launch/evidence/updater-bad-signature-rejection.json");
const rollback = statusFromEvidence("launch/evidence/updater-rollback.json");

finish("stable-updater.json", [
  check(manifest.autoUpdateEnabled === true, "Auto-update is enabled for stable", "Stable requires signed updater support."),
  check(Boolean(manifest.updaterPublicKey), "Updater public key is present", "Tauri updater public key must be embedded in the stable manifest."),
  check(Boolean(manifest.updaterSignature), "Updater signature is present", "Stable updater artifacts must be signed."),
  check(badSignature.status === "PASS", "Bad updater signature is rejected", badSignature.detail),
  check(rollback.status === "PASS", "Updater rollback is ready", rollback.detail),
]);
