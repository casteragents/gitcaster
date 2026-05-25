import { createHash } from "node:crypto";
import type { GitCasterNodeHealth } from "../../../../packages/protocol/dist/types.js";
import type { RouteRegistry } from "../services/route-registry.js";
import { readStoreSummary } from "../services/local-alpha-store.js";
import { MCP_TOOLS } from "./mcp.js";

function hashPayload(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

export function registerHealthRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/health", ({ config, store }) => {
    const summary = readStoreSummary(store);
    const payload: Omit<GitCasterNodeHealth, "proof"> = {
      type: "gitcaster.node.health.v1",
      node: config.nodeName,
      did: config.nodeDid,
      status: "alpha-local",
      storage: {
        mode: config.storageMode,
        verified: false,
      },
      repos: summary.repos,
      refs: summary.refs,
      issues: summary.issues,
      prs: summary.prs,
      agents: summary.agents,
      events: summary.events,
      mcpTools: MCP_TOOLS.length,
      writesAccepted: summary.writesAccepted,
      gossipEvents: 0,
      peersKnown: 0,
      preview: false,
      timestamp: new Date().toISOString(),
    };
    return {
      statusCode: 200,
      body: {
        ...payload,
        proof: {
          hash: hashPayload(payload),
          signature: null,
        },
      },
    };
  });
}
