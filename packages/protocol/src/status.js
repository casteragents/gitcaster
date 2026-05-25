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
];
export function isGitCasterStatus(value) {
    return typeof value === "string" && GITCASTER_STATUSES.includes(value);
}
