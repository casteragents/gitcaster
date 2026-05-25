import { requiresEndpointToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const castercloudTools: GitCasterMcpTool[] = [
  {
    name: "castercloud_verify",
    description: "Return CasterCloud status only when endpoint proof exists.",
    inputSchema: TOOL_SCHEMAS.castercloud_verify,
    call: () => requiresEndpointToolResult("castercloud_verify", ["CASTERCLOUD_PUBLIC_BASE_URL"], "CasterCloud endpoint proof is required before deployment status can pass."),
  },
];
