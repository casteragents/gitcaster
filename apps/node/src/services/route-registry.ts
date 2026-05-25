export interface RouteContext {
  method: string;
  pathname: string;
  params: Record<string, string>;
  body: unknown;
  store: import("./local-alpha-store.js").LocalAlphaStore;
  config: import("../config.js").GitCasterNodeConfig;
  verifiedMutation?: import("./mutation-verify.js").NodeMutationVerificationResult;
}

export type RouteHandler = (ctx: RouteContext) => Promise<{ statusCode: number; body: unknown }> | { statusCode: number; body: unknown };

export interface RouteRecord {
  method: string;
  pattern: string;
  handler: RouteHandler;
}

export class RouteRegistry {
  readonly routes: RouteRecord[] = [];
  add(method: string, pattern: string, handler: RouteHandler): void {
    this.routes.push({ method: method.toUpperCase(), pattern, handler });
  }
}

export function createRouteRegistry(): RouteRegistry {
  return new RouteRegistry();
}

export function matchRoute(registry: RouteRegistry, method: string, pathname: string): (RouteRecord & { params: Record<string, string> }) | null {
  for (const route of registry.routes) {
    if (route.method !== method.toUpperCase()) continue;
    const params: Record<string, string> = {};
    const routeParts = route.pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;
    let ok = true;
    for (let i = 0; i < routeParts.length; i += 1) {
      if (routeParts[i].startsWith(":")) params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      else if (routeParts[i] !== pathParts[i]) ok = false;
    }
    if (ok) return { ...route, params };
  }
  return null;
}
