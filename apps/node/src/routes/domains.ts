import type { RouteRegistry } from "../services/route-registry.js";

function domainRegistryStatus(domain?: string) {
  const base = {
    status: "blocked-by-registry",
    blocker: ".caster registry endpoint not configured.",
  };
  return domain
    ? {
        type: "gitcaster.domain.status.v1",
        domain,
        ...base,
      }
    : {
        type: "gitcaster.domain.request.v1",
        ...base,
        requiredEnv: ["CASTER_DOMAIN_REGISTRY_ENDPOINT"],
      };
}

export function registerDomainRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/domains", () => ({
    statusCode: 200,
    body: {
      type: "gitcaster.domains.index.v1",
      status: "requires-registry",
      domains: [],
      notice: ".caster mapping requires CASTER_DOMAIN_REGISTRY_ENDPOINT and proof.",
    },
  }));
  registry.add("POST", "/domains/request", () => ({ statusCode: 409, body: domainRegistryStatus() }));
  registry.add("GET", "/domains/:domain", ({ params }) => ({ statusCode: 200, body: domainRegistryStatus(params.domain) }));
}
