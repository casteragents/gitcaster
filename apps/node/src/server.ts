import http from "node:http";
import { loadGitCasterNodeConfig, type GitCasterNodeConfig } from "./config.js";
import { parseJsonBody, sendJson, methodPath } from "./services/http.js";
import { createLocalAlphaStore } from "./services/local-alpha-store.js";
import { createRouteRegistry, matchRoute } from "./services/route-registry.js";
import { redactSecrets } from "./services/redact.js";
import { requiredScopeForRoute, verifyNodeMutationRequest } from "./services/mutation-verify.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerNodeRoutes } from "./routes/node.js";
import { registerIdentityRoutes } from "./routes/identity.js";
import { registerRepoRoutes } from "./routes/repos.js";
import { registerRefRoutes } from "./routes/refs.js";
import { registerIssueRoutes } from "./routes/issues.js";
import { registerPrRoutes } from "./routes/prs.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerQStorageRoutes } from "./routes/qstorage.js";
import { registerCasterCloudRoutes } from "./routes/castercloud.js";
import { registerEcosystemRoutes } from "./routes/ecosystem.js";
import { registerMiniappRoutes } from "./routes/miniapps.js";
import { registerDomainRoutes } from "./routes/domains.js";
import { registerMcpRoutes } from "./routes/mcp.js";

export interface StartedNode {
  server: http.Server;
  config: GitCasterNodeConfig;
  url: string;
  close: () => Promise<void>;
}

function registerRoutes(registry: ReturnType<typeof createRouteRegistry>): void {
  registerHealthRoutes(registry);
  registerNodeRoutes(registry);
  registerIdentityRoutes(registry);
  registerRepoRoutes(registry);
  registerRefRoutes(registry);
  registerIssueRoutes(registry);
  registerPrRoutes(registry);
  registerEventRoutes(registry);
  registerQStorageRoutes(registry);
  registerCasterCloudRoutes(registry);
  registerEcosystemRoutes(registry);
  registerMiniappRoutes(registry);
  registerDomainRoutes(registry);
  registerMcpRoutes(registry);
}

export function createGitCasterNodeServer(configOverrides: Partial<GitCasterNodeConfig> = {}): http.Server {
  const config = loadGitCasterNodeConfig(configOverrides);
  const store = createLocalAlphaStore(config);
  const registry = createRouteRegistry();
  registerRoutes(registry);

  return http.createServer(async (req, res) => {
    const { method, pathname } = methodPath(req);
    const route = matchRoute(registry, method, pathname);
    if (!route) {
      sendJson(res, 404, { type: "gitcaster.error.v1", status: "error", error: "route not found", method, pathname });
      return;
    }

    let body: unknown = null;
    if (method === "POST" || method === "PATCH") {
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        sendJson(res, 400, { type: "gitcaster.error.v1", status: "error", error: "malformed json" });
        return;
      }
      body = parsed.value;
      const requiredScope = requiredScopeForRoute(method, pathname);
      if (!requiredScope) {
        sendJson(res, 403, { type: "gitcaster.mutation.blocked.v1", status: "blocked", error: "signed mutation scope not registered" });
        return;
      }
      const verifiedMutation = await verifyNodeMutationRequest({ method, pathname, body, store });
      if (!verifiedMutation.ok) {
        sendJson(res, verifiedMutation.errors.includes("signed mutation envelope required") ? 401 : 403, {
          type: "gitcaster.mutation.blocked.v1",
          status: "blocked",
          scope: requiredScope,
          errors: redactSecrets(verifiedMutation.errors),
        });
        return;
      }
      const result = await route.handler({ method, pathname, params: route.params, body, store, config, verifiedMutation });
      sendJson(res, result.statusCode, redactSecrets(result.body));
      return;
    }

    const result = await route.handler({ method, pathname, params: route.params, body, store, config });
    sendJson(res, result.statusCode, redactSecrets(result.body));
  });
}

export async function startGitCasterNode(configOverrides: Partial<GitCasterNodeConfig> = {}): Promise<StartedNode> {
  const config = loadGitCasterNodeConfig(configOverrides);
  const server = createGitCasterNodeServer(config);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : config.port;
  const actualConfig = { ...config, port };
  return {
    server,
    config: actualConfig,
    url: `http://${actualConfig.host}:${actualConfig.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export async function main(): Promise<void> {
  const started = await startGitCasterNode();
  console.log(JSON.stringify({ type: "gitcaster.node.started.v1", status: "alpha-local", url: started.url }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(JSON.stringify({ type: "gitcaster.error.v1", status: "error", error: (error as Error).message }));
    process.exit(1);
  });
}
