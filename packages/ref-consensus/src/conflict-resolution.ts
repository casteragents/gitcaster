export interface RefConflictEvidence {
  type: "gitcaster.ref.conflict.v1";
  status: "blocked";
  repo: string;
  ref: string;
  expectedFrom: string | null;
  attemptedFrom: string | null;
  attemptedTo: string | null;
  actor: string;
  createdAt: string;
  resolution: "manual-review-required";
}

export function detectRefConflict(args: { expectedFrom: string | null; attemptedFrom: string | null; attemptedTo?: string | null }): boolean {
  return Boolean(args.expectedFrom && args.attemptedFrom !== args.expectedFrom && args.attemptedTo);
}

export function createRefConflictEvidence(args: {
  repo: string;
  ref: string;
  expectedFrom: string | null;
  attemptedFrom: string | null;
  attemptedTo: string | null;
  actor: string;
  createdAt?: string;
}): RefConflictEvidence {
  return {
    type: "gitcaster.ref.conflict.v1",
    status: "blocked",
    repo: args.repo,
    ref: args.ref,
    expectedFrom: args.expectedFrom,
    attemptedFrom: args.attemptedFrom,
    attemptedTo: args.attemptedTo,
    actor: args.actor,
    createdAt: args.createdAt || new Date().toISOString(),
    resolution: "manual-review-required",
  };
}
