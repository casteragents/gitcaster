#!/usr/bin/env node
import { check, finish, readJson } from "./_stable-check-utils.mjs";

const manifest = readJson("STABLE_RELEASE_MANIFEST.json", {});
const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];

finish("stable-artifacts.json", [
  check(artifacts.length > 0, "Stable artifacts are listed", "Manifest must list Windows, macOS, and Linux artifacts."),
  check(artifacts.every((artifact) => artifact.sha256), "Every artifact has SHA256", "Stable artifacts need checksum evidence."),
  check(artifacts.every((artifact) => artifact.signed === true), "Every artifact is signed", "Stable cannot ship unsigned artifacts."),
  check(artifacts.every((artifact) => artifact.signature), "Every artifact has signature metadata", "Stable artifacts require detached or platform signature evidence."),
]);
