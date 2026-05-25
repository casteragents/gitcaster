import type { GitCasterMcpToolResult } from "./tool-registry.js";

export function blockedToolResult(tool: string, reason: string, extra: Record<string, unknown> = {}): GitCasterMcpToolResult {
  return {
    status: "blocked",
    tool,
    result: { reason, ...extra },
    evidence: typeof extra.evidence === "string" ? extra.evidence : "launch/evidence/pr-11-mcp-tools.json",
    notice: reason,
  };
}

export function requiresEndpointToolResult(tool: string, requiredEnv: string[], reason: string): GitCasterMcpToolResult {
  return {
    status: "requires-endpoint",
    tool,
    result: { reason, requiredEnv },
    evidence: "launch/evidence/pr-11-mcp-tools.json",
    notice: reason,
  };
}

export function requiresRegistryToolResult(tool: string, reason: string): GitCasterMcpToolResult {
  return {
    status: "requires-registry",
    tool,
    result: { reason },
    evidence: "launch/evidence/pr-11-mcp-tools.json",
    notice: reason,
  };
}

export function requiresContractToolResult(tool: string, reason: string): GitCasterMcpToolResult {
  return {
    status: "requires-contract",
    tool,
    result: { reason },
    evidence: "launch/evidence/pr-11-mcp-tools.json",
    notice: reason,
  };
}

export function redactToolResult(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/-----BEGIN[\s\S]*?KEY-----/g, "[redacted-key]")
      .replace(/(token|key|authorization)=([^&\s]+)/gi, "$1=[redacted]");
  }
  if (Array.isArray(value)) return value.map(redactToolResult);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        const isPublicCasterToken = (key === "token" && item === "$CASTER") || key === "tokenAddress";
        return [
          key,
          /private|secret|token|authorization/i.test(key) && !isPublicCasterToken ? "[redacted]" : redactToolResult(item),
        ];
      }),
    );
  }
  return value;
}
