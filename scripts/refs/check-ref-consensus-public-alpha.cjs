#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "../..");
const evidencePath = path.join(repoRoot, "launch/evidence/ref-consensus-local-certificate-source.json");

const requiredFiles = [
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
  "apps/node/src/routes/refs.ts",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/services/mutation-verify.ts",
  "scripts/security/test-ref-certificate-redteam.cjs",
  "apps/web/app/open-source/ref-consensus/page.tsx",
  "apps/web/public/gitcaster-ref-consensus.md",
  "docs-source/developer-layers/ref-consensus.md",
  "examples/refs/local-ref-certificate-workflow.example.json",
  "scripts/refs/check-ref-consensus-public-alpha.cjs"
];

const skipScan = new Set(["scripts/refs/check-ref-consensus-public-alpha.cjs"]);

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function json(body) {
  return JSON.parse(body);
}

async function post(base, route, payload) {
  const response = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  return { statusCode: response.status, body: json(await response.text()) };
}

function sha256ish(char) {
  return `sha256:${char.repeat(64)}`;
}

function redactCertificate(cert) {
  return {
    ...cert,
    capability: cert.capability ? { ...cert.capability, signature: "[redacted-signature]" } : undefined,
    signatures: cert.signatures.map((signature) => ({
      signer: signature.signer,
      alg: signature.alg,
      sig: signature.sig ? "[redacted-signature]" : "",
      signedAt: signature.signedAt
    }))
  };
}

function scanSource(blockers) {
  const findings = {
    missingFiles: [],
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    fakeClaimFindings: [],
    sensitiveStateFindings: []
  };

  for (const file of requiredFiles) {
    if (!exists(file)) {
      findings.missingFiles.push(file);
      blockers.push(`missing file: ${file}`);
      continue;
    }
    if (skipScan.has(file)) continue;
    const text = read(file);
    if (/(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i.test(text)) {
      findings.forbiddenReferenceFindings.push({ file, reason: "legacy public identity string found" });
      blockers.push(`${file}: legacy public identity string found`);
    }
    if (/(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i.test(text)) {
      findings.hostedPlatformFindings.push({ file, reason: "hosted platform production dependency mention found" });
      blockers.push(`${file}: hosted platform production dependency mention found`);
    }
    if (/(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|seed phrase|mnemonic|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/.test(text)) {
      findings.secretFindings.push({ file, reason: "secret-like content found" });
      blockers.push(`${file}: secret-like content found`);
    }
    const fakeClaimText = text
      .replace(/\bnot production-ready\b/gi, "not-production-gated")
      .replace(/\bno production-ready\b/gi, "no-production-gated")
      .replace(/\bwithout production-ready\b/gi, "without-production-gated");
    if (/(QStorage verified|CasterCloud deployed|CasterCloud verified|\.caster mapped|normal git push works|production-ready|public nodes online|multi-node replicated|is live now)/i.test(fakeClaimText)) {
      findings.fakeClaimFindings.push({ file, reason: "fake live or production claim found" });
      blockers.push(`${file}: fake live or production claim found`);
    }
    if (/(casteragents-projects|processedIds|pendingReplies|pendingPosts|balances\.json|rankings\.json|casterpunks.*\.(jpg|jpeg|png|webp)|punks.*\.(jpg|jpeg|png|webp))/i.test(text)) {
      findings.sensitiveStateFindings.push({ file, reason: "sensitive runtime state reference found" });
      blockers.push(`${file}: sensitive runtime state reference found`);
    }
  }
  return findings;
}

async function runtimeUnsignedRefBlocker(blockers) {
  const serverModulePath = path.join(repoRoot, "apps/node/dist/server.js");
  if (!fs.existsSync(serverModulePath)) {
    blockers.push("apps/node/dist/server.js missing");
    return null;
  }
  const { startGitCasterNode } = await import(pathToFileURL(serverModulePath).href);
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitcaster-ref-consensus-http-"));
  const started = await startGitCasterNode({ host: "127.0.0.1", port: 0, stateDir });
  try {
    const owner = encodeURIComponent("did:caster:zPublicAlphaOwner");
    const result = await post(started.url, `/repos/${owner}/ref-consensus-local/refs/update`, {
      type: "gitcaster.ref.update.payload.v1",
      ref: "refs/heads/main",
      from: null,
      to: sha256ish("a"),
      objectCids: ["casterobj:unsigned"]
    });
    if (result.statusCode !== 401 || result.body.status !== "blocked" || result.body.scope !== "ref:update") {
      blockers.push("unsigned HTTP ref update was not blocked with ref:update scope");
    }
    return {
      baseUrl: started.url,
      unsignedStatusCode: result.statusCode,
      unsignedStatus: result.body.status,
      unsignedScope: result.body.scope
    };
  } finally {
    await started.close();
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
}

async function directRouteChecks(args) {
  const configModule = await import(pathToFileURL(path.join(repoRoot, "apps/node/dist/config.js")).href);
  const storeModule = await import(pathToFileURL(path.join(repoRoot, "apps/node/dist/services/local-alpha-store.js")).href);
  const routeModule = await import(pathToFileURL(path.join(repoRoot, "apps/node/dist/routes/refs.js")).href);
  const registryModule = await import(pathToFileURL(path.join(repoRoot, "apps/node/dist/services/route-registry.js")).href);
  const repoRecords = await import(pathToFileURL(path.join(repoRoot, "packages/repo-records/dist/index.js")).href);
  const refConsensus = await import(pathToFileURL(path.join(repoRoot, "packages/ref-consensus/dist/index.js")).href);
  const capabilities = await import(pathToFileURL(path.join(repoRoot, "packages/capabilities/dist/index.js")).href);
  const config = configModule.loadGitCasterNodeConfig({ host: "127.0.0.1", port: 0 });
  const store = storeModule.createLocalAlphaStore(config);
  storeModule.registerIdentity(store, {
    did: args.actor,
    publicKeyPem: args.actorKeys.publicKeyPem,
    displayName: "Public Alpha Ref Owner",
    kind: "human",
    registeredAt: args.timestamp
  });
  const repo = repoRecords.createGitCasterRepo({
    ownerDid: args.actor,
    payload: {
      type: "gitcaster.repo.create.payload.v1",
      name: "ref-consensus-local",
      description: "Local ref consensus public-alpha fixture",
      visibility: "public",
      defaultBranch: "main"
    },
    createdAt: args.timestamp
  });
  const event = repoRecords.createRepoCreatedEvent({
    actor: args.actor,
    repoId: repo.id,
    payload: {
      type: "gitcaster.repo.create.payload.v1",
      name: repo.name,
      description: repo.description,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranch
    },
    timestamp: args.timestamp,
    signature: "[redacted-signature]"
  });
  storeModule.createRepoInStore(store, repo, event);
  const registry = registryModule.createRouteRegistry();
  routeModule.registerRefRoutes(registry);

  const ref = "refs/heads/main";
  const to = sha256ish("a");
  const nonce = "route-ref-one";
  const routeCapability = capabilities.signCapability({
    privateKeyPem: args.actorKeys.privateKeyPem,
    capability: capabilities.createUnsignedCapability({
      issuer: args.actor,
      subject: args.actor,
      scope: "ref:update",
      resource: `${repo.id}#${ref}`,
      expiresAt: "2099-01-01T00:00:00.000Z",
      nonce: "cap-route-ref-consensus-public-alpha"
    })
  });
  const routePayload = {
    type: "gitcaster.ref.update.payload.v1",
    ref,
    from: null,
    to,
    objectCids: ["casterobj:route-one"]
  };
  const certHash = refConsensus.refCertificatePayloadHash({
    repo: repo.id,
    ref,
    from: null,
    to,
    objectCids: routePayload.objectCids,
    actor: args.actor,
    node: config.nodeDid,
    timestamp: args.timestamp,
    nonce: `cert-${nonce}`,
    capability: routeCapability
  });
  routePayload.actorSignature = args.identity.signEd25519(args.actorKeys.privateKeyPem, certHash);
  const envelope = {
    type: "gitcaster.signed-mutation.v1",
    actor: args.actor,
    capability: routeCapability,
    payload: routePayload,
    payloadHash: args.identity.sha256Object ? args.identity.sha256Object(routePayload) : certHash,
    timestamp: args.timestamp,
    nonce,
    signature: "[redacted-signature]",
    status: "alpha-local"
  };
  const route = registryModule.matchRoute(registry, "POST", `/repos/${encodeURIComponent(args.actor)}/${repo.name}/refs/update`);
  if (!route) throw new Error("ref update route did not match");
  const update = await route.handler({
    method: "POST",
    pathname: `/repos/${encodeURIComponent(args.actor)}/${repo.name}/refs/update`,
    params: route.params,
    body: { envelope },
    store,
    config,
    verifiedMutation: { ok: true, status: "verified", actor: args.actor, scope: "ref:update", errors: [], envelope }
  });
  const listRoute = registryModule.matchRoute(registry, "GET", `/repos/${encodeURIComponent(args.actor)}/${repo.name}/refs`);
  const listed = await listRoute.handler({
    method: "GET",
    pathname: `/repos/${encodeURIComponent(args.actor)}/${repo.name}/refs`,
    params: listRoute.params,
    body: null,
    store,
    config
  });
  if (update.statusCode !== 200 || update.body.status !== "alpha-local") {
    throw new Error(`direct route ref update did not pass alpha-local: ${JSON.stringify({ statusCode: update.statusCode, body: update.body }).slice(0, 600)}`);
  }
  if (update.body.publicConsensusClaimed !== false || update.body.productionConsensusClaimed !== false) throw new Error("direct route claimed public or production consensus");
  if (listed.statusCode !== 200 || listed.body.status !== "alpha-local") throw new Error("refs list route did not return alpha-local");
  const ledgerEntries = listed.body.ledgers?.[ref]?.length || 0;
  if (ledgerEntries !== 1) throw new Error("refs list route did not expose one local ledger entry");
  return {
    repo: repo.id,
    updateStatusCode: update.statusCode,
    updateStatus: update.body.status,
    listedStatusCode: listed.statusCode,
    listedStatus: listed.body.status,
    ledgerEntries,
    publicConsensusClaimed: update.body.publicConsensusClaimed,
    productionConsensusClaimed: update.body.productionConsensusClaimed,
    certificate: redactCertificate(update.body.certificate)
  };
}

async function packageChecks(blockers) {
  const identity = await import(pathToFileURL(path.join(repoRoot, "packages/identity/dist/index.js")).href);
  const capabilities = await import(pathToFileURL(path.join(repoRoot, "packages/capabilities/dist/index.js")).href);
  const security = await import(pathToFileURL(path.join(repoRoot, "packages/security/dist/index.js")).href);
  const refConsensus = await import(pathToFileURL(path.join(repoRoot, "packages/ref-consensus/dist/index.js")).href);
  const timestamp = new Date().toISOString();
  const repo = "gitcaster://did:caster:zPublicAlphaOwner/ref-consensus-local";
  const ref = "refs/heads/main";
  const actorKeys = identity.generateEd25519KeyPair();
  const nodeKeys = identity.generateEd25519KeyPair();
  const actor = identity.createCasterDIDFromPublicKey(actorKeys.publicKeyPem, "human").id;
  const node = "did:caster:zLocalAlphaRefNode";
  const refCapability = capabilities.signCapability({
    privateKeyPem: actorKeys.privateKeyPem,
    capability: capabilities.createUnsignedCapability({
      issuer: actor,
      subject: actor,
      scope: "ref:update",
      resource: `${repo}#${ref}`,
      expiresAt: "2099-01-01T00:00:00.000Z",
      nonce: "cap-ref-consensus-public-alpha"
    })
  });
  const adminCapability = capabilities.signCapability({
    privateKeyPem: actorKeys.privateKeyPem,
    capability: capabilities.createUnsignedCapability({
      issuer: actor,
      subject: actor,
      scope: "repo:admin",
      resource: repo,
      expiresAt: "2099-01-01T00:00:00.000Z",
      nonce: "cap-ref-consensus-admin-public-alpha"
    })
  });
  const first = await refConsensus.adjudicateRefUpdate({
    ledger: refConsensus.createEmptyRefLedger(repo, ref),
    repo,
    ref,
    from: null,
    to: sha256ish("a"),
    objectCids: ["casterobj:first"],
    actor,
    node,
    timestamp,
    nonce: "first",
    capability: adminCapability,
    actorPrivateKeyPem: actorKeys.privateKeyPem,
    actorPublicKeyPem: actorKeys.publicKeyPem,
    nodePrivateKeyPem: nodeKeys.privateKeyPem,
    now: new Date(timestamp)
  });
  if (!first.ok || !first.certificate || !first.ledger) blockers.push("first local ref certificate was not issued");
  const second = await refConsensus.adjudicateRefUpdate({
    ledger: first.ledger,
    repo,
    ref,
    from: first.certificate?.to,
    to: sha256ish("b"),
    objectCids: ["casterobj:second"],
    actor,
    node,
    timestamp,
    nonce: "second",
    capability: adminCapability,
    actorPrivateKeyPem: actorKeys.privateKeyPem,
    actorPublicKeyPem: actorKeys.publicKeyPem,
    nodePrivateKeyPem: nodeKeys.privateKeyPem,
    now: new Date(timestamp)
  });
  if (!second.ok || !second.certificate || !second.ledger) blockers.push("second local ref certificate was not issued");
  const ledgerVerify = second.ledger
    ? await refConsensus.verifyRefLedgerChain({ ledger: second.ledger, actorPublicKeyPem: actorKeys.publicKeyPem, nodePublicKeyPem: nodeKeys.publicKeyPem })
    : { ok: false, errors: ["missing ledger"] };
  if (!ledgerVerify.ok) blockers.push("local ref ledger did not verify");
  const conflict = await refConsensus.adjudicateRefUpdate({
    ledger: first.ledger,
    repo,
    ref,
    from: null,
    to: sha256ish("c"),
    objectCids: ["casterobj:conflict"],
    actor,
    node,
    timestamp,
    nonce: "conflict",
    capability: adminCapability,
    actorPrivateKeyPem: actorKeys.privateKeyPem,
    actorPublicKeyPem: actorKeys.publicKeyPem,
    nodePrivateKeyPem: nodeKeys.privateKeyPem,
    now: new Date(timestamp)
  });
  if (conflict.ok || conflict.conflictEvidence?.type !== "gitcaster.ref.conflict.v1") blockers.push("wrong-from conflict evidence was not produced");
  const deletion = await refConsensus.adjudicateRefUpdate({
    ledger: first.ledger,
    repo,
    ref,
    from: first.certificate?.to,
    to: null,
    objectCids: ["casterobj:delete"],
    actor,
    node,
    timestamp,
    nonce: "delete",
    capability: adminCapability,
    actorPrivateKeyPem: actorKeys.privateKeyPem,
    actorPublicKeyPem: actorKeys.publicKeyPem,
    nodePrivateKeyPem: nodeKeys.privateKeyPem,
    now: new Date(timestamp)
  });
  if (deletion.ok || !deletion.errors.join("\n").includes("deletion")) blockers.push("branch deletion was not blocked");
  const doubleCandidate = { ...first.certificate, to: sha256ish("f"), payloadHash: "sha256:f" };
  const doubleSignDetected = refConsensus.detectDoubleSign({ existing: [first.certificate], candidate: doubleCandidate });
  const doubleSignEvidence = refConsensus.createDoubleSignEvidence({ repo, ref, node, height: 1, certificateA: first.certificate, certificateB: doubleCandidate });
  if (!doubleSignDetected || doubleSignEvidence.type !== "gitcaster.ref.double-sign.v1") blockers.push("double-sign evidence was not produced");
  const withoutNode = { ...first.certificate, signatures: first.certificate.signatures.filter((signature) => signature.signer !== node) };
  const missingNode = await refConsensus.verifyRefUpdateCertificate({ certificate: withoutNode, actorPublicKeyPem: actorKeys.publicKeyPem, requireNodeSignature: true });
  if (missingNode.ok) blockers.push("missing node signature was not blocked");
  const liveStatus = await refConsensus.verifyRefUpdateCertificate({ certificate: { ...first.certificate, status: "public-alpha" }, actorPublicKeyPem: actorKeys.publicKeyPem, nodePublicKeyPem: nodeKeys.publicKeyPem });
  if (liveStatus.ok) blockers.push("forbidden live/public status was not blocked");
  const policyProtected = await refConsensus.adjudicateRefUpdate({
    ledger: refConsensus.createEmptyRefLedger(repo, ref),
    repo,
    ref,
    from: null,
    to: sha256ish("d"),
    objectCids: ["casterobj:protected"],
    actor,
    node,
    timestamp,
    nonce: "protected",
    capability: refCapability,
    actorPrivateKeyPem: actorKeys.privateKeyPem,
    actorPublicKeyPem: actorKeys.publicKeyPem,
    nodePrivateKeyPem: nodeKeys.privateKeyPem,
    explicitProtectedOverride: true,
    now: new Date(timestamp)
  });
  if (!policyProtected.ok) blockers.push("protected branch explicit local override did not pass");
  const nonceStore = new security.MemoryNonceStore();
  const replayBase = {
    ledger: refConsensus.createEmptyRefLedger(repo, "refs/heads/dev"),
    repo,
    ref: "refs/heads/dev",
    from: null,
    to: sha256ish("e"),
    objectCids: ["casterobj:nonce"],
    actor,
    node,
    timestamp,
    nonce: "replay",
    capability: adminCapability,
    actorPrivateKeyPem: actorKeys.privateKeyPem,
    actorPublicKeyPem: actorKeys.publicKeyPem,
    nodePrivateKeyPem: nodeKeys.privateKeyPem,
    nonceStore,
    now: new Date(timestamp)
  };
  const replayFirst = await refConsensus.adjudicateRefUpdate(replayBase);
  const replaySecond = await refConsensus.adjudicateRefUpdate(replayBase);
  if (!replayFirst.ok || replaySecond.ok) blockers.push("nonce replay was not blocked");
  const route = await directRouteChecks({ actor, actorKeys, refCapability, identity, timestamp });

  return {
    repo,
    ref,
    actor,
    node,
    first: {
      status: first.status,
      certificate: redactCertificate(first.certificate),
      currentHead: refConsensus.getCurrentHead(first.ledger, repo, ref)
    },
    second: {
      status: second.status,
      certificate: redactCertificate(second.certificate),
      ledgerHeight: refConsensus.ledgerHeight(second.ledger, repo, ref),
      ledgerVerified: ledgerVerify.ok
    },
    conflict: {
      status: conflict.status,
      evidence: conflict.conflictEvidence
    },
    deletion: {
      status: deletion.status,
      errors: deletion.errors
    },
    doubleSign: {
      detected: doubleSignDetected,
      evidence: doubleSignEvidence
    },
    missingNodeSignature: {
      status: missingNode.status,
      errors: missingNode.errors
    },
    forbiddenStatus: {
      status: liveStatus.status,
      errors: liveStatus.errors
    },
    protectedOverride: {
      status: policyProtected.status
    },
    nonceReplay: {
      firstStatus: replayFirst.status,
      secondStatus: replaySecond.status,
      secondErrors: replaySecond.errors
    },
    route
  };
}

async function main() {
  const blockers = [];
  const findings = scanSource(blockers);
  const packageResult = await packageChecks(blockers);
  const httpBlockers = await runtimeUnsignedRefBlocker(blockers);
  const evidence = {
    type: "gitcaster.public-release.evidence.v1",
    slice: "ref-consensus-local-certificate-source",
    status: blockers.length ? "failed" : "passed",
    createdAt: new Date().toISOString(),
    filesChanged: requiredFiles,
    commandsRun: [
      "pnpm run ref-consensus:check",
      "pnpm run test:web",
      "node scripts/web/check-pr12-web-ui.cjs",
      "pnpm run secret-scan",
      "node scripts/web/build-static-export-copy.cjs"
    ],
    summary: {
      publicAlphaSourceReleased: true,
      firstCertificateIssued: packageResult.first?.status === "alpha-local",
      secondCertificateIssued: packageResult.second?.status === "alpha-local",
      ledgerVerified: packageResult.second?.ledgerVerified === true,
      conflictEvidenceWritten: packageResult.conflict?.evidence?.type === "gitcaster.ref.conflict.v1",
      deletionBlocked: packageResult.deletion?.status === "blocked",
      doubleSignDetected: packageResult.doubleSign?.detected === true,
      missingNodeSignatureBlocked: packageResult.missingNodeSignature?.status === "blocked",
      forbiddenStatusBlocked: packageResult.forbiddenStatus?.status === "blocked",
      protectedOverrideChecked: packageResult.protectedOverride?.status === "alpha-local",
      nonceReplayBlocked: packageResult.nonceReplay?.secondStatus === "blocked",
      routeUpdateChecked: packageResult.route?.updateStatus === "alpha-local",
      routeLedgerListed: packageResult.route?.ledgerEntries === 1,
      unsignedHttpRefUpdateBlocked: httpBlockers?.unsignedStatus === "blocked",
      publicConsensusClaimed: false,
      remoteRefDurabilityClaimed: false,
      normalGitTransportClaimed: false,
      productionRuntimeClaimed: false,
      secretLeakFindings: findings.secretFindings.length,
      fakeLiveClaimsFound: findings.fakeClaimFindings.length,
      hostedPlatformProductionViolations: findings.hostedPlatformFindings.length,
      forbiddenIdentityViolations: findings.forbiddenReferenceFindings.length
    },
    refConsensus: packageResult,
    httpBlockers,
    releaseQuality: {
      releaseLevel: "public-alpha",
      canShipProduction: false,
      productionBlockers: [
        "Ref-consensus local certificates are public-alpha only.",
        "Public consensus is blocked until signed multi-node ref proof exists.",
        "Remote ref durability is blocked until append-only remote ledger burn-in proof exists.",
        "Normal git transport is blocked until pack transport, storage, and rollback proof exist.",
        "Production runtime remains closed until managed ingress, audit, deployment, and rollback evidence exist."
      ]
    },
    findings,
    blockers
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    status: evidence.status,
    evidence: path.relative(repoRoot, evidencePath).replaceAll("\\", "/"),
    blockers,
    refConsensus: {
      first: packageResult.first?.status,
      second: packageResult.second?.status,
      ledgerHeight: packageResult.second?.ledgerHeight,
      conflict: packageResult.conflict?.status,
      doubleSignDetected: packageResult.doubleSign?.detected,
      routeUpdate: packageResult.route?.updateStatus,
      unsignedHttp: httpBlockers?.unsignedStatus
    }
  }, null, 2));
  if (blockers.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
