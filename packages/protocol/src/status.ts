export const GITCASTER_STATUSES = [
  "verified",
  "live",
  "alpha-local",
  "public-alpha",
  "preview",
  "proof-only",
  "blocked",
  "requires-endpoint",
  "requires-contract",
  "requires-audit",
  "requires-governance",
  "requires-registry",
  "legacy-reference",
  "error",
] as const;

export type GitCasterStatus = (typeof GITCASTER_STATUSES)[number];

export function isGitCasterStatus(value: unknown): value is GitCasterStatus {
  return typeof value === "string" && (GITCASTER_STATUSES as readonly string[]).includes(value);
}
