import type { RouteRegistry } from "../services/route-registry.js";
import { handleCreateIssue, handleListIssues, handleUpdateIssue } from "../services/issue-service.js";

export function registerIssueRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/repos/:owner/:repo/issues", ({ params, store }) => handleListIssues(store, params.owner, params.repo));

  registry.add("POST", "/repos/:owner/:repo/issues", ({ params, store, verifiedMutation }) => {
    if (!verifiedMutation?.envelope) return { statusCode: 403, body: { type: "gitcaster.issue.error.v1", status: "error", error: "missing_verified_envelope" } };
    return handleCreateIssue(store, verifiedMutation.envelope, verifiedMutation, params.owner, params.repo);
  });
  registry.add("PATCH", "/repos/:owner/:repo/issues/:id", ({ params, store, verifiedMutation }) => {
    if (!verifiedMutation?.envelope) return { statusCode: 403, body: { type: "gitcaster.issue.error.v1", status: "error", error: "missing_verified_envelope" } };
    return handleUpdateIssue(store, verifiedMutation.envelope, verifiedMutation, params.owner, params.repo, params.id);
  });
}
