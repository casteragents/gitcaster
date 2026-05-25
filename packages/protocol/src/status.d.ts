export declare const GITCASTER_STATUSES: readonly ["verified", "live", "alpha-local", "public-alpha", "preview", "proof-only", "blocked", "requires-endpoint", "requires-contract", "requires-audit", "requires-governance", "requires-registry", "legacy-reference", "error"];
export type GitCasterStatus = (typeof GITCASTER_STATUSES)[number];
export declare function isGitCasterStatus(value: unknown): value is GitCasterStatus;
