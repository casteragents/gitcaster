import assert from "node:assert/strict";
import test from "node:test";
import { MemoryNonceStore } from "./nonce-store.js";
import { assertFreshNonce, checkTimestampSkew } from "./replay-protection.js";

test("replay protection", () => {
  const store = new MemoryNonceStore();
  assert.equal(assertFreshNonce(store, "fresh").ok, true);
  assert.equal(assertFreshNonce(store, "fresh").ok, false);
  const now = new Date("2026-05-21T00:00:00.000Z");
  assert.equal(checkTimestampSkew("2026-05-21T00:02:00.000Z", 300, now).ok, true);
  assert.equal(checkTimestampSkew("2026-05-20T23:00:00.000Z", 300, now).ok, false);
  assert.equal(checkTimestampSkew("2026-05-21T01:00:00.000Z", 300, now).ok, false);
  assert.equal(checkTimestampSkew("not-a-date", 300, now).ok, false);
});
