import type { NonceStore } from "./nonce-store.js";

export interface ReplayProtectionResult {
  ok: boolean;
  status: "verified" | "blocked" | "error";
  error?: string;
}

export interface TimestampSkewResult {
  ok: boolean;
  status: "verified" | "blocked" | "error";
  skewSeconds?: number;
  error?: string;
}

export function assertFreshNonce(store: NonceStore, nonce: string): ReplayProtectionResult {
  if (!nonce) return { ok: false, status: "blocked", error: "nonce missing" };
  if (!store.checkAndAdd(nonce)) return { ok: false, status: "blocked", error: "nonce replayed" };
  return { ok: true, status: "verified" };
}

export function checkTimestampSkew(timestamp: string, maxSkewSeconds = 300, now: Date = new Date()): TimestampSkewResult {
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time)) return { ok: false, status: "blocked", error: "invalid timestamp" };
  const skewSeconds = Math.round((time - now.getTime()) / 1000);
  if (Math.abs(skewSeconds) > maxSkewSeconds) {
    return { ok: false, status: "blocked", skewSeconds, error: "timestamp skew too large" };
  }
  return { ok: true, status: "verified", skewSeconds };
}
