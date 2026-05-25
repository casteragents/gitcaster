import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { createUnsignedCapability, signCapability } from "./capability.js";
import { isCasterCapabilityScope } from "./scopes.js";
import { verifyCapability } from "./verify.js";

test("capability verification", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  assert.equal(isCasterCapabilityScope("repo:create"), true);
  assert.equal(isCasterCapabilityScope("bad:scope"), false);
  const base = createUnsignedCapability({
    issuer: "did:caster:zIssuer",
    subject: "did:caster:zIssuer",
    scope: "repo:create",
    resource: "gitcaster://did:caster:zIssuer/*",
    expiresAt: "2099-01-01T00:00:00.000Z",
    nonce: "nonce",
  });
  const signed = signCapability({ capability: base, privateKeyPem: privateKey });
  assert.equal(verifyCapability({ capability: signed, publicKeyPem: publicKey, expectedScope: "repo:create", expectedResourcePrefix: "gitcaster://" }).ok, true);
  assert.equal(verifyCapability({ capability: { ...signed, expiresAt: "2000-01-01T00:00:00.000Z" }, publicKeyPem: publicKey }).ok, false);
  assert.equal(verifyCapability({ capability: signed, publicKeyPem: publicKey, expectedScope: "repo:write" }).ok, false);
  assert.equal(verifyCapability({ capability: signed, publicKeyPem: publicKey, expectedResourcePrefix: "gitcaster://other" }).ok, false);
  assert.throws(() => createUnsignedCapability({ ...base, issuer: "did:key:zBad" }));
  assert.throws(() => createUnsignedCapability({ ...base, subject: "did:key:zBad" }));
});
