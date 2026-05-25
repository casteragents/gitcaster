export const CASTER_CAPABILITY_SCOPES = [
  "identity:read",
  "identity:sign",
  "node:read",
  "node:register",
  "repo:read",
  "repo:create",
  "repo:write",
  "repo:admin",
  "ref:read",
  "ref:update",
  "object:read",
  "object:write",
  "issue:read",
  "issue:write",
  "pr:read",
  "pr:write",
  "pr:merge",
  "agent:read",
  "agent:delegate",
  "agent:run",
  "ecosystem:read",
  "ecosystem:submit",
  "miniapp:import",
  "deploy:prepare",
  "deploy:qstorage",
  "deploy:castercloud",
  "domain:request",
  "domain:map",
  "token:reward-proof",
  "security:audit",
  "mcp:serve",
] as const;

export type CasterCapabilityScope = (typeof CASTER_CAPABILITY_SCOPES)[number];

export function isCasterCapabilityScope(value: unknown): value is CasterCapabilityScope {
  return typeof value === "string" && (CASTER_CAPABILITY_SCOPES as readonly string[]).includes(value);
}
