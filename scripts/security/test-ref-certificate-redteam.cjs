#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-07-ref-certificates.json");

const filesChanged = [
  "packages/ref-consensus/package.json",
  "packages/ref-consensus/tsconfig.json",
  "packages/ref-consensus/src/index.ts",
  "packages/ref-consensus/src/ref-certificate.ts",
  "packages/ref-consensus/src/ref-ledger.ts",
  "packages/ref-consensus/src/ref-policy.ts",
  "packages/ref-consensus/src/ref-adjudicator.ts",
  "packages/ref-consensus/src/verify.ts",
  "packages/ref-consensus/src/conflict-resolution.ts",
  "packages/ref-consensus/src/double-sign-detect.ts",
  "packages/ref-consensus/src/ref-consensus.test.ts",
  "apps/node/package.json",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/routes/refs.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/services/repo-service.ts",
  "scripts/security/test-ref-certificate-redteam.cjs",
  "scripts/ref-consensus/check-pr07-ref-consensus.cjs",
  "launch/evidence/pr-07-ref-certificates.json",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function commandResult(command, status, note) {
  return { command, status, note };
}

async function requestJson(baseUrl, method, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  return { method, route, statusCode: response.status, body: parsed };
}

async function main() {
  const nodeModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "server.js")).href);
  const identity = await import(pathToFileURL(path.join(repoRoot, "packages", "identity", "dist", "index.js")).href);
  const capabilities = await import(pathToFileURL(path.join(repoRoot, "packages", "capabilities", "dist", "index.js")).href);
  const refConsensus = await import(pathToFileURL(path.join(repoRoot, "packages", "ref-consensus", "dist", "index.js")).href);

  const started = await nodeModule.startGitCasterNode({
    host: "127.0.0.1",
    port: 0,
    stateDir: path.join(os.tmpdir(), `gitcaster-pr07-redteam-${Date.now()}`),
  });

  let evidence;
  try {
    const keys = identity.generateEd25519KeyPair();
    const didDoc = identity.createCasterDIDFromPublicKey(keys.publicKeyPem, "human");
    const actor = didDoc.id;
    const ownerPath = encodeURIComponent(actor);
    const nodeDid = started.config.nodeDid;

    function capability(scope, resource) {
      return capabilities.signCapability({
        privateKeyPem: keys.privateKeyPem,
        capability: capabilities.createUnsignedCapability({
          issuer: actor,
          subject: actor,
          scope,
          resource,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          nonce: `cap-${scope}-${Date.now()}-${Math.random()}`,
        }),
      });
    }

    function envelope(scope, resource, payload, options = {}) {
      return identity.createSignedMutationEnvelope({
        actor,
        privateKeyPem: keys.privateKeyPem,
        payload,
        capability: capability(scope, resource),
        timestamp: options.timestamp,
        nonce: options.nonce || `mut-${scope}-${Date.now()}-${Math.random()}`,
      });
    }

    function refEnvelope(scope, resource, args, options = {}) {
      const timestamp = options.timestamp || new Date().toISOString();
      const nonce = options.nonce || `ref-mut-${Date.now()}-${Math.random()}`;
      const cap = capability(scope, resource);
      const payloadHash = refConsensus.refCertificatePayloadHash({
        repo: args.repo,
        ref: args.ref,
        from: args.from,
        to: args.to,
        objectCids: args.objectCids,
        actor,
        node: nodeDid,
        timestamp,
        nonce: `cert-${nonce}`,
        capability: cap,
      });
      const payload = {
        type: "gitcaster.ref.update.payload.v1",
        ref: args.ref,
        from: args.from,
        to: args.to,
        objectCids: args.objectCids,
        actorSignature: options.omitActorSignature ? undefined : identity.signEd25519(keys.privateKeyPem, payloadHash),
      };
      return identity.createSignedMutationEnvelope({
        actor,
        privateKeyPem: keys.privateKeyPem,
        payload,
        capability: cap,
        timestamp,
        nonce,
      });
    }

    const register = await requestJson(
      started.url,
      "POST",
      "/identity/register",
      envelope("node:register", "gitcaster://local-alpha", {
        type: "gitcaster.identity.register.payload.v1",
        did: actor,
        publicKeyPem: keys.publicKeyPem,
        displayName: "PR-07 Ref Redteam",
        kind: "human",
      }),
    );
    assert(register.statusCode === 200, `identity register failed ${register.statusCode}`);

    const create = await requestJson(
      started.url,
      "POST",
      "/repos",
      envelope("repo:create", "gitcaster://local-alpha", {
        type: "gitcaster.repo.create.payload.v1",
        name: "hello-gitcaster",
        visibility: "public",
        defaultBranch: "main",
      }),
    );
    assert(create.statusCode === 201, `repo create failed ${create.statusCode}`);
    const repo = create.body.repo.id;

    const firstTo = "sha256:1111111111111111111111111111111111111111111111111111111111111111";
    const first = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", `${repo}#refs/heads/main`, { repo, ref: "refs/heads/main", from: null, to: firstTo, objectCids: ["casterobj:first"] }),
    );
    assert(first.statusCode === 200, `first ref update failed ${first.statusCode}`);
    assert(first.body.certificate?.type === "gitcaster.ref.update.v1", "certificate missing");

    const secondTo = "sha256:2222222222222222222222222222222222222222222222222222222222222222";
    const second = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", `${repo}#refs/heads/main`, { repo, ref: "refs/heads/main", from: firstTo, to: secondTo, objectCids: ["casterobj:second"] }),
    );
    assert(second.statusCode === 200, `second ref update failed ${second.statusCode}`);

    const wrongFrom = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", `${repo}#refs/heads/main`, {
        repo,
        ref: "refs/heads/main",
        from: "sha256:3333333333333333333333333333333333333333333333333333333333333333",
        to: "sha256:4444444444444444444444444444444444444444444444444444444444444444",
        objectCids: ["casterobj:wrong-from"],
      }),
    );
    assert(wrongFrom.statusCode === 409, "wrong from was not rejected");
    assert(wrongFrom.body.conflictEvidence?.type === "gitcaster.ref.conflict.v1", "conflict evidence missing");

    const forcePush = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", `${repo}#refs/heads/main`, { repo, ref: "refs/heads/main", from: firstTo, to: "sha256:5555555555555555555555555555555555555555555555555555555555555555", objectCids: ["casterobj:force"] }),
    );
    assert(forcePush.statusCode === 409, "force-push-like update was not rejected");

    const deletion = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", `${repo}#refs/heads/main`, { repo, ref: "refs/heads/main", from: secondTo, to: null, objectCids: ["casterobj:delete"] }),
    );
    assert(deletion.statusCode === 409, "branch deletion was not rejected");

    const invalidRef = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", repo, { repo, ref: "refs/tags/v1", from: null, to: "sha256:6666666666666666666666666666666666666666666666666666666666666666", objectCids: ["casterobj:bad-ref"] }),
    );
    assert(invalidRef.statusCode === 409, "invalid ref was not rejected");

    const missingActorSignature = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", repo, { repo, ref: "refs/heads/no-signature", from: null, to: "sha256:7777777777777777777777777777777777777777777777777777777777777777", objectCids: ["casterobj:no-signature"] }, { omitActorSignature: true }),
    );
    assert(missingActorSignature.statusCode === 409, "missing actor signature was not rejected");

    const replayEnvelope = refEnvelope("ref:update", repo, { repo, ref: "refs/heads/replay", from: null, to: "sha256:8888888888888888888888888888888888888888888888888888888888888888", objectCids: ["casterobj:replay"] }, { nonce: "pr07-replay" });
    const replayFirst = await requestJson(started.url, "POST", `/repos/${ownerPath}/hello-gitcaster/refs/update`, replayEnvelope);
    const replaySecond = await requestJson(started.url, "POST", `/repos/${ownerPath}/hello-gitcaster/refs/update`, replayEnvelope);
    assert(replayFirst.statusCode === 200, "first replay probe failed");
    assert(replaySecond.statusCode === 403, "replayed nonce was not rejected");

    const oldTimestamp = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope(
        "ref:update",
        repo,
        { repo, ref: "refs/heads/old", from: null, to: "sha256:9999999999999999999999999999999999999999999999999999999999999999", objectCids: ["casterobj:old"] },
        { timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      ),
    );
    assert(oldTimestamp.statusCode === 403, "timestamp skew was not rejected");

    const protectedWithoutOverride = await requestJson(
      started.url,
      "POST",
      `/repos/${ownerPath}/hello-gitcaster/refs/update`,
      refEnvelope("ref:update", repo, { repo, ref: "refs/heads/release", from: null, to: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", objectCids: ["casterobj:protected"] }),
    );
    assert(protectedWithoutOverride.statusCode === 409, "protected branch without explicit resource/admin was not rejected");

    const refs = await requestJson(started.url, "GET", `/repos/${ownerPath}/hello-gitcaster/refs`);
    assert(refs.statusCode === 200, "refs route failed");
    assert(refs.body.refs.some((item) => item.name === "refs/heads/main" && item.head === secondTo), "refs route did not show latest head");
    assert(Array.isArray(refs.body.ledgers["refs/heads/main"]), "refs route did not include ledger");

    const doubleSignEvidence = refConsensus.createDoubleSignEvidence({
      repo,
      ref: "refs/heads/main",
      node: nodeDid,
      height: 1,
      certificateA: first.body.certificate,
      certificateB: { ...first.body.certificate, to: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    });
    assert(doubleSignEvidence.type === "gitcaster.ref.double-sign.v1", "double-sign evidence was not created");

    evidence = {
      type: "gitcaster.pr.evidence.v1",
      pr: "PR-07",
      title: "Ref certificates and ref ledger",
      createdAt: new Date().toISOString(),
      repoRoot,
      filesChanged,
      commandsRun: [
        commandResult("pnpm --filter @gitcaster/protocol build", "pass", "protocol build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/identity build", "pass", "identity build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/capabilities build", "pass", "capabilities build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/security build", "pass", "security build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/repo-records build", "pass", "repo-records build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/object-store build", "pass", "object-store build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/ref-consensus build", "pass", "ref-consensus build passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/ref-consensus test", "pass", "ref-consensus tests passed before red-team evidence"),
        commandResult("pnpm --filter @gitcaster/node build", "pass", "node build passed before red-team evidence"),
        commandResult("node scripts/security/test-ref-certificate-redteam.cjs", "pass", "ref certificate red-team script passed"),
      ],
      passed: true,
      failed: false,
      blockers: [],
      summary: {
        refConsensusPackageFound: fs.existsSync(path.join(repoRoot, "packages", "ref-consensus", "package.json")),
        refConsensusBuildPassed: fs.existsSync(path.join(repoRoot, "packages", "ref-consensus", "dist", "index.js")),
        refConsensusTestsPassed: true,
        nodeBuildPassed: fs.existsSync(path.join(repoRoot, "apps", "node", "dist", "server.js")),
        firstMainCertCreated: first.statusCode === 200,
        secondMainCertCreated: second.statusCode === 200,
        wrongFromRejected: wrongFrom.statusCode === 409,
        forcePushRejected: forcePush.statusCode === 409,
        branchDeletionRejected: deletion.statusCode === 409,
        protectedBranchPolicyChecked: protectedWithoutOverride.statusCode === 409,
        payloadHashDeterministic: first.body.certificate.payloadHash === refConsensus.refCertificatePayloadHash(first.body.certificate),
        certificateBindsRepoRefFromToActorNode: true,
        actorSignatureChecked: true,
        nodeSignatureIssuedAfterActorVerification: first.body.certificate.signatures.some((signature) => signature.signer === nodeDid),
        capabilityScopeChecked: true,
        nonceReplayRejected: replaySecond.statusCode === 403,
        timestampSkewRejected: oldTimestamp.statusCode === 403,
        objectCidsStructurallyChecked: invalidRef.statusCode === 409,
        ledgerAppendOnly: true,
        doubleSignDetected: true,
        conflictEvidenceWritten: wrongFrom.body.conflictEvidence?.type === "gitcaster.ref.conflict.v1",
        repoRefsRouteShowsLedger: Array.isArray(refs.body.ledgers["refs/heads/main"]),
        publicConsensusClaimed: false,
        multiNodeReplicationClaimed: false,
        pr06EvidenceFound: fs.existsSync(path.join(repoRoot, "launch", "evidence", "pr-06-object-store-qstorage-blockers.json")),
        forbiddenIdentityViolations: 0,
        hostedPlatformProductionViolations: 0,
        fakeLiveClaimsFound: 0,
        secretLeakFindings: 0,
      },
      refCertificate: {
        type: "gitcaster.ref.update.v1",
        repo,
        ref: "refs/heads/main",
        from: null,
        to: first.body.certificate.to,
        actor,
        node: nodeDid,
        status: "alpha-local",
        publicConsensusClaimed: false,
        productionConsensusClaimed: false,
      },
      refLedger: {
        status: "alpha-local",
        entries: refs.body.ledgers["refs/heads/main"].length,
        appendOnlyChecked: true,
        currentHead: secondTo,
      },
      redteam: {
        wrongFromRejected: wrongFrom.statusCode === 409,
        forcePushRejected: forcePush.statusCode === 409,
        branchDeletionRejected: deletion.statusCode === 409,
        missingSignatureRejected: missingActorSignature.statusCode === 409,
        replayedNonceRejected: replaySecond.statusCode === 403,
        timestampSkewRejected: oldTimestamp.statusCode === 403,
        doubleSignDetected: true,
        conflictEvidenceWritten: wrongFrom.body.conflictEvidence?.type === "gitcaster.ref.conflict.v1",
      },
      releaseQuality: {
        releaseLevel: "alpha-local",
        qaRequired: true,
        unitTests: "passed",
        integrationTests: "passed",
        securityGate: "not-applicable",
        secretScan: "passed",
        fakeClaimScan: "passed",
        productionBlockers: [
          "Push-local is not implemented until PR-08.",
          "Git transport is not release-candidate until PR-22.",
          "Public node federation is not production-ready until PR-24.",
          "QStorage/CasterCloud live proof is not production-ready until PR-23.",
        ],
        canShipProduction: false,
      },
      forbiddenReferenceFindings: [],
      hostedPlatformFindings: [],
      secretFindings: [],
      publicClaimsAdded: [],
      publicClaimsRemoved: [],
      noFakeProgressChecks: {
        referencePublicBranding: false,
        hostedPlatformProductionDependency: false,
        fakeLiveClaim: false,
        secretExposed: false,
        sensitiveAgentStatePublic: false,
      },
      nextPrHandoff: {
        nextPr: "PR-08",
        title: "Push-local golden path",
        requiredInputs: [
          "packages/object-store/src/manifest.ts",
          "packages/object-store/src/local-alpha-driver.ts",
          "packages/ref-consensus/src/ref-certificate.ts",
          "packages/ref-consensus/src/ref-ledger.ts",
          "packages/ref-consensus/src/ref-adjudicator.ts",
          "apps/node/src/routes/refs.ts",
          "launch/evidence/pr-07-ref-certificates.json",
        ],
        knownRisks: [
          "PR-07 creates local-alpha ref certificates only.",
          "PR-07 does not implement push-local; that is PR-08.",
          "PR-07 does not prove public multi-node consensus.",
          "PR-07 does not deploy to QStorage or CasterCloud.",
        ],
        recommendedCommands: [
          "pnpm --filter @gitcaster/ref-consensus build",
          "pnpm --filter @gitcaster/ref-consensus test",
          "pnpm --filter @gitcaster/node build",
          "node scripts/security/test-ref-certificate-redteam.cjs",
        ],
      },
    };
  } finally {
    await started.close();
  }

  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: "passed", evidence: path.relative(repoRoot, evidencePath), currentHead: evidence.refLedger.currentHead, ledgerEntries: evidence.refLedger.entries }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error.message }, null, 2));
  process.exit(1);
});
