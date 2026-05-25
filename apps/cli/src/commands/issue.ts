export const ISSUE_COMMAND_HELP = `gc issue create <repo> --title "Title" [--body "..."]
gc issue update <repo> <issue-id> --status closed

Uses gitcaster:// repos, did:caster identities, and ~/.gitcaster local identity state.`;

export function buildIssueCreatePayload(args: { repo: string; title: string; body?: string; labels?: string[] }) {
  return {
    type: "gitcaster.issue.create.payload.v1" as const,
    repo: args.repo,
    title: args.title,
    body: args.body || "",
    labels: args.labels || [],
  };
}

export function buildIssueUpdatePayload(args: { repo: string; issueId: string; status?: "open" | "closed"; body?: string }) {
  return {
    type: "gitcaster.issue.update.payload.v1" as const,
    repo: args.repo,
    issueId: args.issueId,
    status: args.status,
    body: args.body,
  };
}

export function printIssueResult(result: unknown): string {
  return JSON.stringify(result, null, 2);
}
