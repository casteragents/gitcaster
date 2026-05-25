import type { RouteRegistry } from "../services/route-registry.js";
import { handleCreatePR, handleListPRs, handleMergePR, handleReviewPR, handleViewPR } from "../services/pr-service.js";

export function registerPrRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/repos/:owner/:repo/prs", ({ params, store }) => handleListPRs(store, params.owner, params.repo));

  registry.add("POST", "/repos/:owner/:repo/prs", ({ params, store, verifiedMutation }) => {
    if (!verifiedMutation?.envelope) return { statusCode: 403, body: { type: "gitcaster.pr.error.v1", status: "error", error: "missing_verified_envelope" } };
    return handleCreatePR(store, verifiedMutation.envelope, verifiedMutation, params.owner, params.repo);
  });
  registry.add("GET", "/repos/:owner/:repo/prs/:id", ({ params, store }) => handleViewPR(store, params.owner, params.repo, params.id));
  registry.add("POST", "/repos/:owner/:repo/prs/:id/review", ({ params, store, verifiedMutation }) => {
    if (!verifiedMutation?.envelope) return { statusCode: 403, body: { type: "gitcaster.pr.error.v1", status: "error", error: "missing_verified_envelope" } };
    return handleReviewPR(store, verifiedMutation.envelope, verifiedMutation, params.owner, params.repo, params.id);
  });
  registry.add("POST", "/repos/:owner/:repo/prs/:id/merge", ({ params, store, verifiedMutation }) => {
    if (!verifiedMutation?.envelope) return { statusCode: 403, body: { type: "gitcaster.pr.error.v1", status: "error", error: "missing_verified_envelope" } };
    return handleMergePR(store, verifiedMutation.envelope, verifiedMutation, params.owner, params.repo, params.id);
  });
}
