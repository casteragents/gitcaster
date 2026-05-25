#!/usr/bin/env node
import { check, finish, readJson } from "./_stable-check-utils.mjs";

const manifest = readJson("STABLE_RELEASE_MANIFEST.json", {});
const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];

finish("stable-manifest.json", [
  check(manifest.channel === "stable", "Manifest channel is stable", "Stable manifest must use channel=stable."),
  check(manifest.stable === true, "Manifest declares stable=true", "Do not reuse the public-alpha manifest."),
  check(manifest.signed === true, "Manifest declares signed=true", "Stable cannot be unsigned."),
  check(manifest.autoUpdateEnabled === true, "Manifest enables updater", "Stable needs signed auto-update."),
  check(Boolean(manifest.rollbackVersion), "Rollback version is present", "Stable requires rollback metadata."),
  check(Boolean(manifest.minimumSupportedVersion), "Minimum supported version is present", "Stable requires a support floor."),
  check(artifacts.every((artifact) => !String(artifact.url || "").includes("/alpha/")), "Artifacts do not point to alpha kit", "Stable artifacts must not reuse public-alpha zips."),
]);
