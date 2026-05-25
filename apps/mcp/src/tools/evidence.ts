import fs from "node:fs";
import path from "node:path";
import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const evidenceTools: GitCasterMcpTool[] = [
  {
    name: "launch_evidence_bundle",
    description: "List existing launch evidence without claiming final bundle completeness.",
    inputSchema: TOOL_SCHEMAS.launch_evidence_bundle,
    call: (_args, context) => {
      const dir = path.join(context.cwd, "launch/evidence");
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((file) => /^pr-\d+.*\.json$/.test(file)).sort() : [];
      if (files.length === 0) return blockedToolResult("launch_evidence_bundle", "Launch evidence bundle is deferred until bundle PRs.");
      return {
        status: "proof-only",
        tool: "launch_evidence_bundle",
        result: { files, bundleCompleteClaimed: false },
        evidence: "launch/evidence/pr-11-mcp-tools.json",
        notice: "Existing evidence is listed only; final bundle completeness is deferred.",
      };
    },
  },
];
