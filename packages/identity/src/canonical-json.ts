import { createHash } from "node:crypto";

export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "undefined" || typeof value === "function") {
    throw new TypeError("Unsupported canonical JSON value");
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => typeof record[key] !== "undefined")
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  throw new TypeError("Unsupported canonical JSON value");
}

export function sha256Hex(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? Buffer.from(input) : Buffer.from(input);
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256Uri(input: string | Uint8Array): string {
  return `sha256:${sha256Hex(input)}`;
}
