import { blockedTransportDecision, type GitCasterTransportDecision } from "./transport-status.js";

export function explainPushBlocked(): GitCasterTransportDecision {
  return blockedTransportDecision({
    mode: "pack-mode",
    reason: "Full Git pack push is not implemented in PR-09. Use gc repo push-local for the local alpha golden path. Release-candidate Git transport is PR-22.",
    requiredEvidence: ["pack receive proof", "ref certificate proof", "object bundle proof"],
  });
}

export async function handlePushCommand(): Promise<GitCasterTransportDecision> {
  return explainPushBlocked();
}
