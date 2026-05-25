import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".cjs": "application/javascript",
  ".ts": "text/typescript",
  ".tsx": "text/tsx",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".wasm": "application/wasm",
};

const IGNORED_DIRS = new Set([".git", "node_modules", ".next", "out", "build", "dist", "coverage", "target", ".cache", "tmp"]);
const IGNORED_FILES = new Set([".env", ".env.local", ".env.production", "private.key", "identity.pem", "wallet.json", "seed.txt"]);

export function detectMime(filePath: string): string {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

export function isBinaryLike(filePath: string): boolean {
  return ["image/png", "image/jpeg", "application/wasm", "application/octet-stream"].includes(detectMime(filePath));
}

export function isIgnoredObjectPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.some((part) => IGNORED_DIRS.has(part))) return true;
  return parts.some((part) => IGNORED_FILES.has(part));
}
