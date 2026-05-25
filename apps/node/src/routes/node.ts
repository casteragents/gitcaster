import type { RouteRegistry } from "../services/route-registry.js";
import { listAgents, listEvents, listRepos, readStoreSummary } from "../services/local-alpha-store.js";

function secondsSince(timestamp: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(timestamp).getTime());
  return `${Math.floor(elapsed / 1000)}s`;
}

export function registerNodeRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/node/status", ({ config, store }) => {
    const summary = readStoreSummary(store);
    return {
      statusCode: 200,
      body: {
        type: "gitcaster.node.status.v1",
        status: "alpha-local",
        node: {
          type: "gitcaster.node.v1",
          did: config.nodeDid,
          name: config.nodeName,
          region: "local-alpha",
          endpoint: `http://${config.host}:${config.port}`,
          status: "alpha-local",
          peerCount: 0,
          repoCount: summary.repos,
          agentCount: summary.agents,
          writesAccepted: summary.writesAccepted,
          gossipEvents: 0,
          qstorageObjects: 0,
          uptime: secondsSince(store.startedAt),
          lastActivityAt: store.events.at(-1)?.timestamp || store.startedAt,
        },
        notice: "Local alpha node only. Not public network telemetry.",
      },
    };
  });

  registry.add("GET", "/node/registry", () => ({
    statusCode: 200,
    body: {
      type: "gitcaster.node.registry.v1",
      status: "alpha-local",
      nodes: ["node.gitcaster.casterchain", "node2.gitcaster.casterchain", "node3.gitcaster.casterchain"].map((name, index) => ({
        name,
        status: "blocked",
        did: `did:caster:zLocalAlphaPlannedNode${index + 1}`,
        publicUrl: null,
        blocker: "Public CasterCloud node evidence is not present in PR-04.",
      })),
    },
  }));

  registry.add("GET", "/node/repos", ({ store }) => ({
    statusCode: 200,
    body: {
      type: "gitcaster.node.repos.v1",
      status: "alpha-local",
      count: listRepos(store).length,
      repos: listRepos(store),
    },
  }));

  registry.add("GET", "/node/agents", ({ store }) => ({
    statusCode: 200,
    body: {
      type: "gitcaster.node.agents.v1",
      status: "alpha-local",
      agents: listAgents(store),
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
}
