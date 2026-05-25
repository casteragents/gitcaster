import type { GitCasterMcpContext } from "./tool-registry.js";

export function resolveGitCasterNodeUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const primary = env.GITCASTER_NODE?.trim();
  if (primary) return primary.replace(/\/+$/, "");
  const alternate = env.CASTER_NODE_URL?.trim();
  if (alternate) return alternate.replace(/\/+$/, "");
  return null;
}

export function redactNodeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) return { name: error.name, message: error.message.replace(/(token|key|authorization)=([^&\s]+)/gi, "$1=[redacted]") };
  return { message: "unknown node client error" };
}

async function nodeRequest(pathname: string, init: RequestInit, context: GitCasterMcpContext): Promise<unknown> {
  const baseUrl = resolveGitCasterNodeUrl(context.env);
  if (!baseUrl) throw new Error("GITCASTER_NODE or CASTER_NODE_URL is required");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), context.timeoutMs || 2500);
  try {
    const response = await fetch(`${baseUrl}${pathname}`, { ...init, signal: controller.signal });
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(`node responded ${response.status}: ${JSON.stringify(json)}`);
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export async function nodeGet(pathname: string, context: GitCasterMcpContext): Promise<unknown> {
  return nodeRequest(pathname, { method: "GET", headers: { accept: "application/json" } }, context);
}

export async function nodePost(pathname: string, envelope: unknown, context: GitCasterMcpContext): Promise<unknown> {
  return nodeRequest(pathname, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(envelope) }, context);
}

export async function nodePatch(pathname: string, envelope: unknown, context: GitCasterMcpContext): Promise<unknown> {
  return nodeRequest(pathname, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(envelope) }, context);
}
