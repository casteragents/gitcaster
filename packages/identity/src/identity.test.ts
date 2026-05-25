import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { canonicalize } from "./canonical-json.js";
import { createCasterDIDFromPublicKey, createCasterDIDDocument } from "./did-caster.js";
import { generateEd25519KeyPair } from "./ed25519.js";
import { createSignedMutationEnvelope, signFile, verifyFileSignature, verifySignedMutationEnvelope } from "./signature-envelope.js";

test("identity and signature spine", () => {
  const keys = generateEd25519KeyPair();
  assert.match(keys.publicKeyPem, /BEGIN PUBLIC KEY/);
  assert.match(keys.privateKeyPem, /BEGIN PRIVATE KEY/);
  const did = createCasterDIDFromPublicKey(keys.publicKeyPem);
  assert.match(did.id, /^did:caster:z/);
  const doc = createCasterDIDDocument({ did: did.id, publicKeyPem: keys.publicKeyPem });
  assert.equal(doc.method, "caster");
  assert.equal(JSON.stringify(doc).includes("PRIVATE KEY"), false);

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "gitcaster-pr03-test-"));
  const filePath = path.join(temp, "payload.txt");
  fs.writeFileSync(filePath, "hello gitcaster");
  const fileSignature = signFile({ path: filePath, signer: did.id, privateKeyPem: keys.privateKeyPem });
  assert.equal(verifyFileSignature({ fileSignature, publicKeyPem: keys.publicKeyPem }), true);
  const wrongKeys = generateEd25519KeyPair();
  assert.equal(verifyFileSignature({ fileSignature, publicKeyPem: wrongKeys.publicKeyPem }), false);
  assert.equal(canonicalize({ b: 1, a: 2 }), canonicalize({ a: 2, b: 1 }));

  const capability = {
    type: "gitcaster.capability.v1" as const,
    issuer: did.id,
    subject: did.id,
    scope: "repo:create" as const,
    resource: `gitcaster://${did.id}/*`,
    expiresAt: "2099-01-01T00:00:00.000Z",
    nonce: "cap-test",
    signature: "fixture-signature-not-cryptographic",
    status: "alpha-local" as const,
  };
  const envelope = createSignedMutationEnvelope({
    actor: did.id,
    privateKeyPem: keys.privateKeyPem,
    payload: { type: "gitcaster.repo.create.payload.v1", name: "hello" },
    capability,
    nonce: "mutation-test",
  });
  assert.equal(verifySignedMutationEnvelope({ envelope, publicKeyPem: keys.publicKeyPem, expectedScope: "repo:create" }).ok, true);
  const tampered = { ...envelope, payload: { type: "gitcaster.repo.create.payload.v1", name: "tampered" } };
  assert.equal(verifySignedMutationEnvelope({ envelope: tampered, publicKeyPem: keys.publicKeyPem }).ok, false);
  assert.equal(verifySignedMutationEnvelope({ envelope, publicKeyPem: wrongKeys.publicKeyPem }).ok, false);
  assert.equal(verifySignedMutationEnvelope({ ...{ envelope: { ...envelope, signature: "fixture-signature-not-cryptographic" } }, publicKeyPem: keys.publicKeyPem }).ok, false);
});
