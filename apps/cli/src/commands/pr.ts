export const PR_COMMAND_HELP = `gc pr create <repo> --head feature/demo --base main --title "Title"
gc pr review <repo> <pr-id> --status approved
gc pr merge <repo> <pr-id> --strategy record-only

Uses gitcaster:// repos, did:caster identities, and ~/.gitcaster local identity state.`;

export function buildPRCreatePayload(args: { repo: string; head: string; base: string; title: string; body?: string }) {
  return {
    type: "gitcaster.pr.create.payload.v1" as const,
    repo: args.repo,
    head: args.head,
    base: args.base,
    title: args.title,
    body: args.body || "",
  };
}

export function buildPRReviewPayload(args: { repo: string; prId: string; status: "approved" | "changes-requested" | "commented"; body?: string }) {
  return {
    type: "gitcaster.pr.review.payload.v1" as const,
    repo: args.repo,
    prId: args.prId,
    status: args.status,
    body: args.body || "",
  };
}

export function buildPRMergePayload(args: { repo: string; prId: string; strategy?: "record-only" | "fast-forward" }) {
  return {
    type: "gitcaster.pr.merge.payload.v1" as const,
    repo: args.repo,
    prId: args.prId,
    strategy: args.strategy || "record-only",
  };
}

export function printPRResult(result: unknown): string {
  return JSON.stringify(result, null, 2);
}
