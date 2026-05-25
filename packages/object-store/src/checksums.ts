import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

function canonicalize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => typeof record[key] !== "undefined")
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("Unsupported canonical object value");
}

export function hashToUri(hash: string): string {
  return hash.startsWith("sha256:") ? hash : `sha256:${hash}`;
}

export function sha256Buffer(input: Uint8Array | Buffer): string {
  return hashToUri(createHash("sha256").update(input).digest("hex"));
}

export function sha256Text(input: string): string {
  return sha256Buffer(Buffer.from(input, "utf8"));
}

export async function sha256File(path: string): Promise<string> {
  return sha256Buffer(await readFile(path));
}

export function sha256Object(value: unknown): string {
  return sha256Text(canonicalize(value));
}

export function createRootHash(items: Array<{ path: string; hash: string; size: number }>): string {
  const normalized = items
    .map((item) => ({ path: item.path.replace(/\\/g, "/"), hash: hashToUri(item.hash), size: item.size }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return sha256Object(normalized);
}
