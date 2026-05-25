import type { RouteRegistry } from "../services/route-registry.js";
import { handleCreateRepo, handleGetRepo, handleGetRepoProofs, handleGetRepoRefs, handleGetRepoTree, handleListRepos } from "../services/repo-service.js";
import { handlePushLocalRoute } from "./push-local.js";

function repoBlocked(owner: string, repo: string) {
  return {
    type: "gitcaster.repo.lookup.v1",
    status: "blocked",
    reason: "Repo records are implemented in PR-05.",
    owner,
    repo,
  };
}

export function registerRepoRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/repos", ({ store }) => handleListRepos(store));

  registry.add("POST", "/repos", ({ store, verifiedMutation }) => {
    if (!verifiedMutation?.envelope) {
      return { statusCode: 403, body: { type: "gitcaster.repo.create.error.v1", status: "error", error: "missing_verified_envelope" } };
    }
    return handleCreateRepo(store, verifiedMutation.envelope, verifiedMutation);
  });

  registry.add("GET", "/repos/:owner/:repo", ({ params, store }) => {
    const result = handleGetRepo(store, params.owner, params.repo);
    if (result.statusCode === 404) return { statusCode: 404, body: repoBlocked(params.owner, params.repo) };
    return result;
  });

  registry.add("GET", "/repos/:owner/:repo/tree", ({ params, store }) => handleGetRepoTree(store, params.owner, params.repo));

  registry.add("GET", "/repos/:owner/:repo/refs", ({ params, store }) => handleGetRepoRefs(store, params.owner, params.repo));

  registry.add("GET", "/repos/:owner/:repo/proofs", ({ params, store }) => handleGetRepoProofs(store, params.owner, params.repo));

  registry.add("POST", "/repos/:owner/:repo/push-local", ({ store, verifiedMutation, config }) => handlePushLocalRoute({ store, verifiedMutation, config }));
}
