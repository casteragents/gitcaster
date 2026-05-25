import type { RouteRegistry } from "../services/route-registry.js";
import { listEvents } from "../services/local-alpha-store.js";
import { handleGetRepoEvents } from "../services/repo-service.js";

export function registerEventRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/events", ({ store }) => ({
    statusCode: 200,
    body: {
      type: "gitcaster.events.v1",
      status: "alpha-local",
      events: listEvents(store),
    },
  }));

  registry.add("GET", "/node/events", ({ store }) => ({
    statusCode: 200,
    body: {
      type: "gitcaster.node.events.v1",
      status: "alpha-local",
      events: listEvents(store),
    },
  }));

  registry.add("GET", "/repos/:owner/:repo/events", ({ params, store }) => {
    return handleGetRepoEvents(store, params.owner, params.repo);
  });
}
