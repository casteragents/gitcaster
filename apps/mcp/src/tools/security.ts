import fs from "node:fs";
import path from "node:path";
import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const securityTools: GitCasterMcpTool[] = [
  {
    name: "security_proof_gate",
    description: "List security proof evidence when present; otherwise block until PR-18.",
    inputSchema: TOOL_SCHEMAS.security_proof_gate,
    call: (_args, context) => {
      const evidence = path.join(context.cwd, "launch/evidence/pr-18-security-proof-gate.json");
      if (!fs.existsSync(evidence)) return blockedToolResult("security_proof_gate", "Security proof gate is deferred to PR-18.");
      return { status: "proof-only", tool: "security_proof_gate", result: { evidence: "launch/evidence/pr-18-security-proof-gate.json" }, evidence: "launch/evidence/pr-18-security-proof-gate.json" };
    },
  },
];
