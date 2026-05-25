import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const miniappTools: GitCasterMcpTool[] = [
  { name: "miniapp_import", description: "Miniapp import blocker for PR-14.", inputSchema: TOOL_SCHEMAS.miniapp_import, call: () => blockedToolResult("miniapp_import", "Miniapp import is deferred to PR-14.") },
  { name: "miniapp_compat_check", description: "Miniapp compatibility blocker for PR-14.", inputSchema: TOOL_SCHEMAS.miniapp_compat_check, call: () => blockedToolResult("miniapp_compat_check", "Miniapp compatibility checks are deferred to PR-14.") },
];
