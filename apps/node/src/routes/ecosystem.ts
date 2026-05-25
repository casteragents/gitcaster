import type { RouteRegistry } from "../services/route-registry.js";

export function registerEcosystemRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/ecosystem", () => ({
    statusCode: 200,
    body: {
      type: "gitcaster.ecosystem.index.v1",
      status: "preview",
      entries: [],
      notice: "Canonical ecosystem manifest is implemented in PR-13.",
    },
  }));
  registry.add("POST", "/ecosystem/import", () => ({
    statusCode: 409,
    body: {
      type: "gitcaster.route.blocker.v1",
      status: "blocked",
      reason: "Ecosystem import is implemented in PR-13.",
      nextPr: "PR-13",
    },
  }));
  registry.add("POST", "/ecosystem/submit", () => ({
    statusCode: 409,
    body: {
      type: "gitcaster.route.blocker.v1",
      status: "blocked",
      reason: "Ecosystem submission handling is implemented after PR-13.",
      nextPr: "PR-13",
    },
  }));
}
