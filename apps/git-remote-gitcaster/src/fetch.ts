import { blockedTransportDecision, type GitCasterTransportDecision } from "./transport-status.js";

export function explainFetchBlocked(): GitCasterTransportDecision {
  return blockedTransportDecision({
    mode: "fetch-mode",
    reason: "Full Git pack fetch or clone is not implemented in PR-09. Ref listing is available when a local alpha node is configured. Release-candidate Git transport is PR-22.",
    requiredEvidence: ["pack upload proof", "object download proof", "ref list proof"],
  });
}

export async function handleFetchCommand(): Promise<GitCasterTransportDecision> {
  return explainFetchBlocked();
}
