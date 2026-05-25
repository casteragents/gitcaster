import type { RouteRegistry } from "../services/route-registry.js";

export function registerMiniappRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/miniapps", () => ({
    statusCode: 200,
    body: {
      type: "gitcaster.miniapps.index.v1",
      status: "preview",
      miniapps: [],
      notice: "Miniapp import is implemented later; Caster Claim Miniapp target appears in PR-14.",
    },
  }));
  registry.add("POST", "/miniapps/import", () => ({
    statusCode: 409,
    body: {
      type: "gitcaster.route.blocker.v1",
      status: "blocked",
      reason: "Miniapp import is implemented in PR-14.",
      nextPr: "PR-14",
    },
  }));
  registry.add("POST", "/miniapps/compat", () => ({
    statusCode: 409,
    body: {
      type: "gitcaster.route.blocker.v1",
      status: "blocked",
      reason: "Miniapp compatibility checks are implemented in PR-14.",
      nextPr: "PR-14",
    },
  }));
}
