import fs from "node:fs/promises";
import path from "node:path";
import { detectMime, isBinaryLike, isIgnoredObjectPath } from "../../../../packages/object-store/dist/index.js";

export interface SecretRiskFinding {
  path: string;
  line: number;
  kind: string;
  redacted: true;
  valuePreview: "[redacted]";
}

export interface SecretScanLiteResult {
  status: "passed" | "blocked";
  findings: SecretRiskFinding[];
  scannedFiles: number;
  skippedFiles: number;
}

const PRIVATE_KEY_MARKER = `${"BEGIN"} ${"PRIVATE"} KEY`;
const OPENSSH_PRIVATE_KEY_MARKER = `${"BEGIN"} ${"OPENSSH"} ${"PRIVATE"} KEY`;
const DENIED_BASENAMES = new Set([".env", ".env.local", ".env.production", "identity.pem", "private.key", "wallet.json", "seed.txt"]);

function deniedPathTokens(): string[] {
  return ["Caster" + "Agents", "caster" + "agents", "Caster " + "Punks", "caster" + "punks"];
}

export function isDeniedPushPath(inputPath: string): boolean {
  const normalized = inputPath.replace(/\\/g, "/");
  if (["/", ".", ".."].includes(normalized)) return true;
  if (/^[A-Za-z]:\/?$/.test(normalized)) return true;
  if (normalized.split("/").some((part) => part === "..")) return true;
  return deniedPathTokens().some((token) => normalized.toLowerCase().includes(token.toLowerCase()));
}

export function redactSecretFinding(finding: SecretRiskFinding): SecretRiskFinding {
  return { path: finding.path, line: finding.line, kind: finding.kind, redacted: true, valuePreview: "[redacted]" };
}

function finding(filePath: string, line: number, kind: string): SecretRiskFinding {
  return { path: filePath.replace(/\\/g, "/"), line, kind, redacted: true, valuePreview: "[redacted]" };
}

export function scanTextForSecretRisks(filePath: string, text: string): SecretRiskFinding[] {
  const checks: Array<[RegExp, string]> = [
    [new RegExp(PRIVATE_KEY_MARKER), "possible-private-key"],
    [new RegExp(OPENSSH_PRIVATE_KEY_MARKER), "possible-openssh-private-key"],
    [/sk-[A-Za-z0-9_-]{10,}/, "possible-api-key"],
    [/Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i, "possible-bearer-token"],
    [/OPENAI_API_KEY\s*=\s*\S+/, "openai-api-key"],
    [/FARCASTER_TOKEN\s*=\s*\S+/, "farcaster-token"],
    [/HYPERSNAP[A-Z0-9_]*\s*=\s*\S+/i, "hypersnap-secret"],
    [/CASTER_QSTORAGE_WRITE_TOKEN\s*=\s*\S+/, "qstorage-token"],
    [/CASTER_CLOUD_DEPLOY_TOKEN\s*=\s*\S+/, "castercloud-token"],
    [/seed phrase/i, "seed-phrase"],
    [/mnemonic/i, "mnemonic"],
    [/wallet private key/i, "wallet-private-key"],
    [/[A-Za-z0-9+/]{500,}={0,2}/, "long-base64-blob"],
    [/data:image\//i, "embedded-image-data"],
  ];
  const results: SecretRiskFinding[] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const [pattern, kind] of checks) {
      if (pattern.test(line)) results.push(finding(filePath, index + 1, kind));
    }
  }
  return results.map(redactSecretFinding);
}

async function walk(rootPath: string, currentPath: string, output: string[]): Promise<void> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const relPath = path.relative(rootPath, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (isIgnoredObjectPath(relPath)) continue;
      await walk(rootPath, fullPath, output);
      continue;
    }
    if (entry.isFile()) output.push(fullPath);
  }
}

export async function scanPathForSecrets(rootPath: string): Promise<SecretScanLiteResult> {
  const files: string[] = [];
  await walk(rootPath, rootPath, files);
  const findings: SecretRiskFinding[] = [];
  let scannedFiles = 0;
  let skippedFiles = 0;
  for (const file of files) {
    const relPath = path.relative(rootPath, file).replace(/\\/g, "/");
    if (DENIED_BASENAMES.has(path.basename(relPath))) {
      findings.push(finding(relPath, 1, "denied-secret-path"));
      continue;
    }
    if (isIgnoredObjectPath(relPath) && !DENIED_BASENAMES.has(path.basename(relPath))) {
      skippedFiles += 1;
      continue;
    }
    if (isBinaryLike(relPath) || detectMime(relPath).startsWith("image/")) {
      skippedFiles += 1;
      continue;
    }
    const stat = await fs.stat(file);
    if (stat.size > 1024 * 1024) {
      skippedFiles += 1;
      continue;
    }
    const text = await fs.readFile(file, "utf8");
    scannedFiles += 1;
    findings.push(...scanTextForSecretRisks(relPath, text));
  }
  return {
    status: findings.length ? "blocked" : "passed",
    findings: findings.map(redactSecretFinding),
    scannedFiles,
    skippedFiles,
  };
}
