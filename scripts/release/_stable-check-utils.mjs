import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const root = process.cwd();
export const evidenceDir = path.join(root, "launch", "evidence");

export function ensureEvidenceDir() {
  mkdirSync(evidenceDir, { recursive: true });
}

export function readJson(relPath, fallback = null) {
  const absolute = path.join(root, relPath);
  if (!existsSync(absolute)) return fallback;
  return JSON.parse(readFileSync(absolute, "utf8"));
}

export function writeEvidence(name, report) {
  ensureEvidenceDir();
  const relPath = path.join("launch", "evidence", name);
  writeFileSync(path.join(root, relPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return relPath.replaceAll("\\", "/");
}

export function statusFromEvidence(relPath) {
  const data = readJson(relPath);
  if (!data) return { status: "MISSING", detail: `${relPath} is missing` };
  const status = String(data.status || data.verdict || data.result || "").toUpperCase();
  return {
    status: status || "MISSING",
    detail: data.detail || data.notes || data.message || "",
  };
}

export function finish(name, checks) {
  const failures = checks.filter((check) => check.status !== "PASS");
  const report = {
    status: failures.length === 0 ? "PASS" : "NO-GO",
    checkedAt: new Date().toISOString(),
    summary: {
      pass: checks.length - failures.length,
      fail: failures.length,
      total: checks.length,
    },
    checks,
  };
  const relPath = writeEvidence(name, report);
  console.log(`[stable] ${name}: ${report.status}`);
  console.log(`[stable] Evidence: ${relPath}`);
  if (report.status !== "PASS") process.exitCode = 1;
}

export function check(condition, name, detail) {
  return { name, status: condition ? "PASS" : "FAIL", detail };
}
