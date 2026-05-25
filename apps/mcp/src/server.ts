#!/usr/bin/env node
import { createInterface } from "node:readline";
import { callTool, listTools, type GitCasterMcpContext } from "./tool-registry.js";
import { createJsonRpcError, createJsonRpcResult, parseJsonRpcMessage, type JsonRpcRequest } from "./json-rpc.js";

export function createGitCasterMcpServer(args: Partial<GitCasterMcpContext> = {}): GitCasterMcpContext {
  return {
    env: args.env || process.env,
    cwd: args.cwd || process.cwd(),
    timeoutMs: args.timeoutMs || 2500,
  };
}

export async function handleMcpRequest(request: JsonRpcRequest, context: GitCasterMcpContext): Promise<unknown> {
  if (request.method === "initialize") {
    return {
      protocolVersion: "2025-03-26",
      serverInfo: { name: "gitcaster", version: "0.1.0-alpha" },
      capabilities: { tools: {} },
      status: "alpha-local",
    };
  }
  if (request.method === "tools/list") {
    return { tools: listTools(context), status: "alpha-local" };
  }
  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (!params?.name) throw new Error("tools/call requires tool name");
    return {
      content: [{ type: "text", text: JSON.stringify(await callTool(params.name, params.arguments || {}, context), null, 2) }],
      status: "alpha-local",
    };
  }
  throw new Error(`unknown method: ${request.method}`);
}

export async function main(): Promise<void> {
  const context = createGitCasterMcpServer();
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let request: JsonRpcRequest | null = null;
    try {
      request = parseJsonRpcMessage(line);
      process.stdout.write(`${JSON.stringify(createJsonRpcResult(request.id, await handleMcpRequest(request, context)))}\n`);
    } catch (error) {
      process.stdout.write(`${JSON.stringify(createJsonRpcError(request?.id || null, -32603, error instanceof Error ? error.message : "MCP request failed"))}\n`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  main().catch((error) => {
    process.stderr.write(`gitcaster-mcp: ${error instanceof Error ? error.message : "unknown error"}\n`);
    process.exitCode = 1;
  });
}
