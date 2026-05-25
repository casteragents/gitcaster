import { createHash } from "node:crypto";
import { blockedToolResult } from "../blockers.js";
import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

const secretMarkers = [
  "BEGIN .*KEY",
  "seed phrase",
  "mnemonic",
  "Authorization:",
];
const secretEnvNames = ["OPENAI_API_KEY", "FARCASTER_TOKEN", "CASTER_KEY"];

function looksSecretLike(value: string): boolean {
  const envPatterns = secretEnvNames.map((name) => `${name}\\s*=`);
  return new RegExp([...secretMarkers, ...envPatterns].join("|"), "i").test(value) || value.length > 4096;
}

export const identityTools: GitCasterMcpTool[] = [
  {
    name: "identity_show",
    description: "Show configured local CasterDID identity without exposing private key material.",
    inputSchema: TOOL_SCHEMAS.identity_show,
    call: (_args, context) => {
      const did = context.env.CASTER_DID;
      if (!did) return blockedToolResult("identity_show", "Local CasterDID identity is not configured. Run gc identity new.");
      return {
        status: "alpha-local",
        tool: "identity_show",
        result: {
          did,
          publicFingerprint: `sha256:${createHash("sha256").update(did).digest("hex").slice(0, 24)}`,
          privateKey: "[redacted]",
        },
        evidence: "launch/evidence/pr-11-mcp-tools.json",
        notice: "Private key material is never returned.",
      };
    },
  },
  {
    name: "identity_sign",
    description: "Sign harmless local input only when a local signing identity is configured.",
    inputSchema: TOOL_SCHEMAS.identity_sign,
    call: (args, context) => {
      const input = typeof args.input === "string" ? args.input : "";
      if (looksSecretLike(input)) return blockedToolResult("identity_sign", "Refusing to sign input that looks like a secret or environment dump.");
      if (!context.env.CASTER_DID || !context.env.CASTER_KEY) return blockedToolResult("identity_sign", "identity_sign requires local CasterDID identity and signing key.");
      return {
        status: "alpha-local",
        tool: "identity_sign",
        result: {
          did: context.env.CASTER_DID,
          payloadHash: `sha256:${createHash("sha256").update(input).digest("hex")}`,
          signatureStatus: "local-alpha-placeholder",
        },
        evidence: "launch/evidence/pr-11-mcp-tools.json",
        notice: "PR-11 signs harmless local input only and does not expose key material.",
      };
    },
  },
];
