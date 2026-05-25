export type GitCasterTransportMode = "push-local" | "bundle-mode" | "pack-mode" | "fetch-mode" | "ref-list-mode";

export type GitCasterTransportStatus = "alpha-local" | "blocked" | "error";

export interface GitCasterTransportDecision {
  type: "gitcaster.git-transport.decision.v1";
  status: GitCasterTransportStatus;
  mode: GitCasterTransportMode;
  working: boolean;
  reason: string;
  requiredEvidence: string[];
  nextPr: "PR-22";
  normalGitPushClaimed: false;
  normalGitCloneClaimed: false;
}

export function blockedTransportDecision(args: {
  mode: GitCasterTransportMode;
  reason: string;
  requiredEvidence?: string[];
}): GitCasterTransportDecision {
  return {
    type: "gitcaster.git-transport.decision.v1",
    status: "blocked",
    mode: args.mode,
    working: false,
    reason: args.reason,
    requiredEvidence: args.requiredEvidence || [],
    nextPr: "PR-22",
    normalGitPushClaimed: false,
    normalGitCloneClaimed: false,
  };
}

export function alphaLocalTransportDecision(args: {
  mode: GitCasterTransportMode;
  reason: string;
  requiredEvidence?: string[];
  working?: boolean;
}): GitCasterTransportDecision {
  return {
    type: "gitcaster.git-transport.decision.v1",
    status: "alpha-local",
    mode: args.mode,
    working: args.working ?? true,
    reason: args.reason,
    requiredEvidence: args.requiredEvidence || [],
    nextPr: "PR-22",
    normalGitPushClaimed: false,
    normalGitCloneClaimed: false,
  };
}

export function formatTransportDecision(decision: GitCasterTransportDecision): string {
  return [
    `status=${decision.status}`,
    `mode=${decision.mode}`,
    `working=${decision.working ? "true" : "false"}`,
    `normalGitPushClaimed=${decision.normalGitPushClaimed}`,
    `normalGitCloneClaimed=${decision.normalGitCloneClaimed}`,
    `next=${decision.nextPr}`,
    `reason=${decision.reason}`,
  ].join("\n");
}
