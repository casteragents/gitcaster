export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result: unknown;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export function parseJsonRpcMessage(line: string): JsonRpcRequest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new Error("invalid JSON-RPC JSON");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("JSON-RPC message must be an object");
  const request = parsed as Partial<JsonRpcRequest>;
  if (request.jsonrpc !== "2.0") throw new Error("JSON-RPC version must be 2.0");
  if (typeof request.method !== "string" || !request.method) throw new Error("JSON-RPC method is required");
  return request as JsonRpcRequest;
}

export function createJsonRpcResult(id: JsonRpcRequest["id"], result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

export function createJsonRpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown): JsonRpcErrorResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message: message.replace(/(token|key|authorization)=([^&\s]+)/gi, "$1=[redacted]"),
      data,
    },
  };
}
