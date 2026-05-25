import type { ParsedGitCasterUrl } from "./protocol.js";

export interface NodeRepoResult {
  status: "alpha-local" | "blocked" | "error";
  repo?: Record<string, unknown>;
  reason?: string;
  error?: Record<string, unknown>;
}

export interface NodeRefsResult {
  status: "alpha-local" | "blocked" | "error";
  refs: Array<{ name: string; head: string | null; cid?: string | null }>;
  reason?: string;
  error?: Record<string, unknown>;
}

function cleanNodeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  if (/^[a-z0-9.-]+(?::\d+)?$/i.test(trimmed)) return `https://${trimmed}`.replace(/\/+$/, "");
  return null;
}

export function resolveGitCasterNodeUrl(env: NodeJS.ProcessEnv = process.env, parsed?: ParsedGitCasterUrl): string | null {
  const gitcasterNode = env.GITCASTER_NODE ? cleanNodeUrl(env.GITCASTER_NODE) : null;
  if (gitcasterNode) return gitcasterNode;
  const casterNode = env.CASTER_NODE_URL ? cleanNodeUrl(env.CASTER_NODE_URL) : null;
  if (casterNode) return casterNode;
  if (parsed?.nodeHint) return cleanNodeUrl(parsed.nodeHint);
  return null;
}

export function redactNodeClientError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message.replace(/(token|key|authorization)=([^&\s]+)/gi, "$1=[redacted]") };
  }
  return { message: "unknown node client error" };
}

async function fetchJson(url: string, timeoutMs = 2_500): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`node responded ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getNodeRepo(args: {
  nodeUrl: string | null;
  ownerDid: string;
  repo: string;
  timeoutMs?: number;
}): Promise<NodeRepoResult> {
  if (!args.nodeUrl) return { status: "blocked", reason: "GITCASTER_NODE or CASTER_NODE_URL is required for node repo lookup." };
  try {
    const url = `${args.nodeUrl}/repos/${encodeURIComponent(args.ownerDid)}/${encodeURIComponent(args.repo)}`;
    const json = await fetchJson(url, args.timeoutMs);
    return { status: "alpha-local", repo: json as Record<string, unknown> };
  } catch (error) {
    return { status: "error", reason: "node repo lookup failed", error: redactNodeClientError(error) };
  }
}

export async function getNodeRepoRefs(args: {
  nodeUrl: string | null;
  ownerDid: string;
  repo: string;
  timeoutMs?: number;
}): Promise<NodeRefsResult> {
  if (!args.nodeUrl) return { status: "blocked", refs: [], reason: "GITCASTER_NODE or CASTER_NODE_URL is required for ref listing." };
  try {
    const url = `${args.nodeUrl}/repos/${encodeURIComponent(args.ownerDid)}/${encodeURIComponent(args.repo)}/refs`;
    const json = await fetchJson(url, args.timeoutMs);
    const refs = Array.isArray((json as { refs?: unknown }).refs) ? ((json as { refs: unknown[] }).refs as Array<Record<string, unknown>>) : [];
    return {
      status: "alpha-local",
      refs: refs.map((ref) => ({
        name: String(ref.name || ""),
        head: typeof ref.head === "string" ? ref.head : null,
        cid: typeof ref.cid === "string" ? ref.cid : null,
      })).filter((ref) => ref.name.length > 0),
    };
  } catch (error) {
    return { status: "error", refs: [], reason: "node ref listing failed", error: redactNodeClientError(error) };
  }
}
