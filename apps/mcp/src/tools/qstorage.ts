import { requiresEndpointToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const qstorageTools: GitCasterMcpTool[] = [
  {
    name: "qstorage_verify",
    description: "Return QStorage verification status only when endpoint proof exists.",
    inputSchema: TOOL_SCHEMAS.qstorage_verify,
    call: () => requiresEndpointToolResult("qstorage_verify", ["QSTORAGE_PUBLIC_BASE_URL"], "QStorage endpoint proof is required before verification can pass."),
  },
];
