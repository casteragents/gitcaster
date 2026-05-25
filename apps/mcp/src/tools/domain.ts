import { requiresRegistryToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const domainTools: GitCasterMcpTool[] = [
  { name: "domain_request", description: "Domain request requires registry proof.", inputSchema: TOOL_SCHEMAS.domain_request, call: () => requiresRegistryToolResult("domain_request", "Domain registry proof is required before mappings can be requested.") },
  { name: "domain_status", description: "Domain status requires registry proof.", inputSchema: TOOL_SCHEMAS.domain_status, call: () => requiresRegistryToolResult("domain_status", "Domain registry proof is required before status can pass.") },
];
