import test from "node:test";
import assert from "node:assert/strict";
import { generateEd25519KeyPair, createCasterDIDFromPublicKey, signEd25519 } from "../../identity/dist/index.js";
import { createUnsignedCapability, signCapability } from "../../capabilities/dist/index.js";
import { MemoryNonceStore } from "../../security/dist/index.js";
import {
  adjudicateRefUpdate,
  appendRefCertificate,
  assertAppendOnlyRefLedger,
  createDoubleSignEvidence,
  createEmptyRefLedger,
  createRefConflictEvidence,
  detectDoubleSign,
  getCurrentHead,
  issueRefUpdateCertificate,
  listRefCertificates,
  refCertificatePayloadHash,
  validateRefName,
  verifyRefLedgerChain,
  verifyRefUpdateCertificate,
} from "./index.js";
import type { CasterCapabilityScope } from "../../protocol/dist/types.js";

const repo = "gitcaster://did:caster:zPr07Owner/hello-gitcaster";
const ref = "refs/heads/main";
const nodeDid = "did:caster:zLocalAlphaNode";

function actorFixture(scope: CasterCapabilityScope = "repo:admin", resource = repo) {
  const actorKeys = generateEd25519KeyPair();
  const nodeKeys = generateEd25519KeyPair();
  const actor = createCasterDIDFromPublicKey(actorKeys.publicKeyPem, "human").id;
  const capability = signCapability({
    privateKeyPem: actorKeys.privateKeyPem,
    capability: createUnsignedCapability({
      issuer: actor,
      subject: actor,
      scope,
      resource,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      nonce: `cap-${Date.now()}-${Math.random()}`,
    }),
  });
  return { actorKeys, nodeKeys, actor, capability };
}

async function issueFirst() {
  const fx = actorFixture();
  const result = await issueRefUpdateCertificate({
    repo,
    ref,
    from: null,
    to: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    objectCids: ["casterobj:first"],
    actor: fx.actor,
    node: nodeDid,
    nonce: "first",
    capability: fx.capability,
    actorPrivateKeyPem: fx.actorKeys.privateKeyPem,
    actorPublicKeyPem: fx.actorKeys.publicKeyPem,
    nodePrivateKeyPem: fx.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, true);
  return { ...fx, certificate: result.certificate! };
}

test("first main cert can be created with from null", async () => {
  const { certificate } = await issueFirst();
  assert.equal(certificate.type, "gitcaster.ref.update.v1");
  assert.equal(certificate.from, null);
  assert.equal(certificate.status, "alpha-local");
});

test("second main cert with correct from passes", async () => {
  const first = await issueFirst();
  const ledger = appendRefCertificate(createEmptyRefLedger(repo, ref), first.certificate);
  const result = await adjudicateRefUpdate({
    ledger,
    repo,
    ref,
    from: first.certificate.to,
    to: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    objectCids: ["casterobj:second"],
    actor: first.actor,
    node: nodeDid,
    nonce: "second",
    capability: first.capability,
    actorPrivateKeyPem: first.actorKeys.privateKeyPem,
    actorPublicKeyPem: first.actorKeys.publicKeyPem,
    nodePrivateKeyPem: first.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, true);
  assert.equal(getCurrentHead(result.ledger!, repo, ref), result.certificate!.to);
});

test("wrong from fails and conflict evidence is created", async () => {
  const first = await issueFirst();
  const ledger = appendRefCertificate(createEmptyRefLedger(repo, ref), first.certificate);
  const result = await adjudicateRefUpdate({
    ledger,
    repo,
    ref,
    from: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    to: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    objectCids: ["casterobj:conflict"],
    actor: first.actor,
    node: nodeDid,
    nonce: "wrong-from",
    capability: first.capability,
    actorPrivateKeyPem: first.actorKeys.privateKeyPem,
    actorPublicKeyPem: first.actorKeys.publicKeyPem,
    nodePrivateKeyPem: first.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, false);
  assert.equal(result.conflictEvidence?.type, "gitcaster.ref.conflict.v1");
});

test("force push fails by default", async () => {
  const first = await issueFirst();
  const ledger = appendRefCertificate(createEmptyRefLedger(repo, ref), first.certificate);
  const result = await adjudicateRefUpdate({
    ledger,
    repo,
    ref,
    from: null,
    to: "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    objectCids: ["casterobj:force"],
    actor: first.actor,
    node: nodeDid,
    nonce: "force",
    capability: first.capability,
    actorPrivateKeyPem: first.actorKeys.privateKeyPem,
    actorPublicKeyPem: first.actorKeys.publicKeyPem,
    nodePrivateKeyPem: first.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /force push|conflicting/);
});

test("branch deletion fails by default", async () => {
  const first = await issueFirst();
  const result = await adjudicateRefUpdate({
    ledger: createEmptyRefLedger(repo, ref),
    repo,
    ref,
    from: null,
    to: null,
    objectCids: ["casterobj:delete"],
    actor: first.actor,
    node: nodeDid,
    nonce: "delete",
    capability: first.capability,
    actorPrivateKeyPem: first.actorKeys.privateKeyPem,
    actorPublicKeyPem: first.actorKeys.publicKeyPem,
    nodePrivateKeyPem: first.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /deletion/);
});

test("invalid ref name fails", () => {
  assert.equal(validateRefName("refs/tags/v1").ok, false);
  assert.equal(validateRefName("refs/heads/bad branch").ok, false);
  assert.equal(validateRefName("refs/heads/main").ok, true);
});

test("protected branch requires admin or explicit allowed scope", async () => {
  const normal = actorFixture("ref:update", `${repo}#refs/heads/main`);
  const denied = await adjudicateRefUpdate({
    ledger: createEmptyRefLedger(repo, ref),
    repo,
    ref,
    from: null,
    to: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    objectCids: ["casterobj:protected"],
    actor: normal.actor,
    node: nodeDid,
    nonce: "protected-denied",
    capability: normal.capability,
    actorPrivateKeyPem: normal.actorKeys.privateKeyPem,
    actorPublicKeyPem: normal.actorKeys.publicKeyPem,
    nodePrivateKeyPem: normal.nodeKeys.privateKeyPem,
  });
  assert.equal(denied.ok, false);
  const allowed = await adjudicateRefUpdate({
    ledger: createEmptyRefLedger(repo, ref),
    repo,
    ref,
    from: null,
    to: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    objectCids: ["casterobj:protected"],
    actor: normal.actor,
    node: nodeDid,
    nonce: "protected-allowed",
    capability: normal.capability,
    actorPrivateKeyPem: normal.actorKeys.privateKeyPem,
    actorPublicKeyPem: normal.actorKeys.publicKeyPem,
    nodePrivateKeyPem: normal.nodeKeys.privateKeyPem,
    explicitProtectedOverride: true,
  });
  assert.equal(allowed.ok, true);
});

test("certificate payload hash is deterministic and binds fields", async () => {
  const first = await issueFirst();
  assert.equal(refCertificatePayloadHash(first.certificate), first.certificate.payloadHash);
  const text = JSON.stringify(first.certificate);
  assert.equal(text.includes(repo), true);
  assert.equal(text.includes(ref), true);
  assert.equal(text.includes(first.actor), true);
  assert.equal(text.includes(nodeDid), true);
});

test("ledger append is append-only and current head is latest cert", async () => {
  const first = await issueFirst();
  const previous = createEmptyRefLedger(repo, ref);
  const next = appendRefCertificate(previous, first.certificate);
  assertAppendOnlyRefLedger(previous, next);
  assert.equal(getCurrentHead(next, repo, ref), first.certificate.to);
  assert.equal(listRefCertificates(next, repo, ref).length, 1);
});

test("double-sign attempt is detected", async () => {
  const first = await issueFirst();
  const second = { ...first.certificate, to: "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", payloadHash: "sha256:f" };
  assert.equal(detectDoubleSign({ existing: [first.certificate], candidate: second }), true);
  assert.equal(createDoubleSignEvidence({ repo, ref, node: nodeDid, height: 1, certificateA: first.certificate, certificateB: second }).type, "gitcaster.ref.double-sign.v1");
});

test("missing actor signature fails", async () => {
  const fx = actorFixture();
  const result = await issueRefUpdateCertificate({
    repo,
    ref,
    from: null,
    to: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    objectCids: ["casterobj:first"],
    actor: fx.actor,
    node: nodeDid,
    nonce: "missing-actor-sig",
    capability: fx.capability,
    actorPublicKeyPem: fx.actorKeys.publicKeyPem,
    nodePrivateKeyPem: fx.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, false);
});

test("missing node signature fails verification where required", async () => {
  const first = await issueFirst();
  const withoutNode = { ...first.certificate, signatures: first.certificate.signatures.filter((signature) => signature.signer !== nodeDid) };
  const result = await verifyRefUpdateCertificate({ certificate: withoutNode, actorPublicKeyPem: first.actorKeys.publicKeyPem, requireNodeSignature: true });
  assert.equal(result.ok, false);
});

test("objectCids structural check works", async () => {
  const fx = actorFixture();
  const result = await issueRefUpdateCertificate({
    repo,
    ref,
    from: null,
    to: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    objectCids: ["not-valid"],
    actor: fx.actor,
    node: nodeDid,
    nonce: "bad-object",
    capability: fx.capability,
    actorPrivateKeyPem: fx.actorKeys.privateKeyPem,
    actorPublicKeyPem: fx.actorKeys.publicKeyPem,
    nodePrivateKeyPem: fx.nodeKeys.privateKeyPem,
  });
  assert.equal(result.ok, false);
});

test("nonce replay and timestamp skew are rejected", async () => {
  const fx = actorFixture();
  const nonceStore = new MemoryNonceStore();
  const base = {
    ledger: createEmptyRefLedger(repo, ref),
    repo,
    ref,
    from: null,
    to: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    objectCids: ["casterobj:first"],
    actor: fx.actor,
    node: nodeDid,
    nonce: "replay",
    capability: fx.capability,
    actorPrivateKeyPem: fx.actorKeys.privateKeyPem,
    actorPublicKeyPem: fx.actorKeys.publicKeyPem,
    nodePrivateKeyPem: fx.nodeKeys.privateKeyPem,
    nonceStore,
  };
  assert.equal((await adjudicateRefUpdate(base)).ok, true);
  assert.equal((await adjudicateRefUpdate(base)).ok, false);
  assert.equal(
    (
      await adjudicateRefUpdate({
        ...base,
        nonce: "old-time",
        nonceStore: new MemoryNonceStore(),
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      })
    ).ok,
    false,
  );
});

test("ledger chain verifies and generated cert has no forbidden names or live status", async () => {
  const first = await issueFirst();
  const ledger = appendRefCertificate(createEmptyRefLedger(repo, ref), first.certificate);
  assert.equal((await verifyRefLedgerChain({ ledger, actorPublicKeyPem: first.actorKeys.publicKeyPem, nodePublicKeyPem: first.nodeKeys.publicKeyPem })).ok, true);
  const text = JSON.stringify(first.certificate);
  assert.equal(new RegExp(`git${"lawb"}`, "i").test(text), false);
  assert.equal(/"status":"(live|verified|public-alpha|production|deployed|mapped|replicated)"/.test(text), false);
  assert.equal(createRefConflictEvidence({ repo, ref, expectedFrom: first.certificate.to, attemptedFrom: null, attemptedTo: "sha256:f", actor: first.actor }).type, "gitcaster.ref.conflict.v1");
});
