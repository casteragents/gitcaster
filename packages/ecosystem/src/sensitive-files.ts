export const SENSITIVE_FILE_NAMES = [
  "balances.json",
  "rankings.json",
  "processed_ids.txt",
  "last_rewarded.json",
  "tipped.json",
  "tipping_rankings.json",
  "tipperrankings.json",
  "pending-posts.json",
  "pending-replies.json",
  "pending-drops.json",
  "aicaster-drop-limits.json"
];

export const SECRET_RISK_FILE_NAMES = [
  ".env",
  ".env.local",
  ".env.production",
  "private.key",
  "identity.pem",
  "seed.txt",
  "wallet.json",
  "openai.ts",
  "farcaster.ts",
  "hypersnap.ts",
  "bearer",
  "token",
  "api_key",
  "secret"
];

function norm(input: string): string {
  return input.replace(/\\/g, "/").toLowerCase();
}

export function isSensitiveRuntimeStatePath(inputPath: string): boolean {
  const normalized = norm(inputPath);
  return SENSITIVE_FILE_NAMES.some((name) => normalized.endsWith(`/${name}`) || normalized === name);
}

export function isSecretRiskPath(inputPath: string): boolean {
  const normalized = norm(inputPath);
  return SECRET_RISK_FILE_NAMES.some((name) => normalized.includes(name));
}

export function classifySensitivePath(inputPath: string): "sensitive-runtime-state" | "secret-risk" | "public" {
  if (isSensitiveRuntimeStatePath(inputPath)) return "sensitive-runtime-state";
  if (isSecretRiskPath(inputPath)) return "secret-risk";
  return "public";
}

export function redactSensitiveFinding(finding: { path: string; classification: string; reason?: string }) {
  return {
    path: finding.path,
    classification: finding.classification,
    reason: finding.reason ?? "sensitive path only; contents not read",
    redacted: true
  };
}
