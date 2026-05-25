import type { IncomingMessage, ServerResponse } from "node:http";
import { safeJsonParse } from "./json.js";

export async function readRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

export function methodPath(req: IncomingMessage): { method: string; pathname: string } {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  return { method: (req.method || "GET").toUpperCase(), pathname: url.pathname };
}

export async function parseJsonBody(req: IncomingMessage): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  return safeJsonParse(await readRequestBody(req));
}
