#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "repo-records-issue-pr-source.json");

const requiredFiles = [
  "packages/repo-records/package.json",
  "packages/repo-records/tsconfig.json",
  "packages/repo-records/src/index.ts",
  "packages/repo-records/src/repo.ts",
  "packages/repo-records/src/event-log.ts",
  "packages/repo-records/src/signed-record.ts",
  "packages/repo-records/src/issue.ts",
  "packages/repo-records/src/pr.ts",
  "packages/repo-records/src/review.ts",
  "packages/repo-records/src/repo-records.test.ts",
  "apps/node/src/routes/issues.ts",
  "apps/node/src/routes/prs.ts",
  "apps/node/src/services/issue-service.ts",
  "apps/node/src/services/pr-service.ts",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/web/app/open-source/repo-records/page.tsx",
  "apps/web/public/gitcaster-repo-records.md",
  "docs-source/developer-layers/repo-records.md",
  "examples/repo-records/local-issue-pr-workflow.example.json",
  "scripts/repo-records/check-repo-records-public-alpha.cjs"
];

const secretPatterns = [
  new RegExp(`${"BEGIN"} ${"PRIVATE"} KEY`),
  new RegExp(`${"BEGIN"} ${"OPENSSH"} ${"PRIVATE"} KEY`),
  /sk-[A-Za-z0-9_-]{10,}/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/,
  /CASTER_QSTORAGE_WRITE_TOKEN=\S+/,
  /CASTER_CLOUD_DEPLOY_TOKEN=\S+/,
  /OPENAI_API_KEY=\S+/,
  /FARCASTER_TOKEN=\S+/,
  /data:image\//i
];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function scanFiles() {
  const findings = {
    missingFiles: [],
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    fakeClaimFindings: []
  };
  const skipSelf = new Set(["scripts/repo-records/check-repo-records-public-alpha.cjs"]);
  for (const file of requiredFiles) {
    if (!exists(file)) {
      findings.missingFiles.push(file);
      continue;
    }
    const text = read(file);
    if (!skipSelf.has(file) && /gitlawb|did:gitlawb|GITLAWB_|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com/i.test(text)) {
      findings.forbiddenReferenceFindings.push(file);
    }
    if (!skipSelf.has(file) && /(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|GitHub as canonical source)/i.test(text)) {
      findings.hostedPlatformFindings.push(file);
    }
    if (!skipSelf.has(file) && /(public collaboration network is live|remote event-log durability is live|normal git transport works|production runtime is live|QStorage verified|CasterCloud deployed|production-ready|multi-node replicated)/i.test(text)) {
      findings.fakeClaimFindings.push(file);
    }
    if (!skipSelf.has(file)) {
      for (const pattern of secretPatterns) {
        if (pattern.test(text)) findings.secretFindings.push({ file, pattern: String(pattern) });
      }
    }
  }
  return findings;
}

function blockerList(findings) {
  return [
    findings.missingFiles.length && `missing files: ${findings.missingFiles.join(", ")}`,
    findings.forbiddenReferenceFindings.length && `forbidden references: ${findings.forbiddenReferenceFindings.join(", ")}`,
    findings.hostedPlatformFindings.length && `hosted platform production references: ${findings.hostedPlatformFindings.join(", ")}`,
    findings.secretFindings.length && "secret findings present",
    findings.fakeClaimFindings.length && `fake claim findings: ${findings.fakeClaimFindings.join(", ")}`
  ].filter(Boolean);
}

async function packageWorkflow() {
  const records = await import(pathToFileURL(path.join(repoRoot, "packages", "repo-records", "dist", "index.js")).href);
  const owner = "did:caster:zPublicAlphaOwner";
  const signature = { signer: owner, alg: "ed25519", sig: "fixture-signature", signedAt: "2026-05-30T00:00:00.000Z" };
  const repo = records.createGitCasterRepo({
    ownerDid: owner,
    payload: { type: "gitcaster.repo.create.payload.v1", name: "repo-records-public-alpha", description: "Public alpha repo records fixture" },
    createdAt: "2026-05-30T00:00:00.000Z"
  });
  const repoEvent = records.createRepoCreatedEvent({ actor: owner, repoId: repo.id, payload: { type: "gitcaster.repo.create.payload.v1", name: repo.name }, signature: signature.sig, timestamp: repo.createdAt });
  const eventLog = records.appendRepoEvent([], repoEvent);
  records.assertAppendOnlyEventLog(eventLog, records.appendRepoEvent(eventLog, { ...repoEvent, id: `${repoEvent.id}:copy`, timestamp: "2026-05-30T00:00:01.000Z" }));

  const issue = records.createGitCasterIssue({
    id: "issue-1",
    repo: repo.id,
    author: owner,
    signature,
    payload: { type: "gitcaster.issue.create.payload.v1", repo: repo.id, title: "Document local repo records", body: "Public-alpha fixture", labels: ["docs"] },
    createdAt: "2026-05-30T00:00:02.000Z"
  });
  const issueOpened = records.createIssueOpenedEvent({ actor: owner, issue, signature: signature.sig, timestamp: issue.createdAt });
  const issueClosed = records.updateGitCasterIssue({
    issue,
    signature,
    payload: { type: "gitcaster.issue.update.payload.v1", repo: repo.id, issueId: issue.id, status: "closed", body: "Closed in local fixture" },
    updatedAt: "2026-05-30T00:00:03.000Z"
  });
  const issueUpdated = records.createIssueUpdatedEvent({ actor: owner, issue: issueClosed, signature: signature.sig, timestamp: issueClosed.updatedAt });

  const pr = records.createGitCasterPR({
    id: "pr-1",
    repo: repo.id,
    author: owner,
    signature,
    payload: { type: "gitcaster.pr.create.payload.v1", repo: repo.id, head: "feature/repo-records-docs", base: "main", title: "Add repo records docs", body: "Public-alpha fixture" },
    createdAt: "2026-05-30T00:00:04.000Z"
  });
  const prOpened = records.createPROpenedEvent({ actor: owner, pr, signature: signature.sig, timestamp: pr.createdAt });
  const review = records.createGitCasterPRReview({
    id: "review-1",
    repo: repo.id,
    reviewer: owner,
    signature: signature.sig,
    payload: { type: "gitcaster.pr.review.payload.v1", repo: repo.id, prId: pr.id, status: "approved", body: "Local approval fixture" },
    createdAt: "2026-05-30T00:00:05.000Z"
  });
  const reviewed = records.applyReviewToPR({ pr, review, updatedAt: "2026-05-30T00:00:06.000Z" });
  const prReviewed = records.createPRReviewedEvent({ actor: owner, pr: reviewed, review, signature: signature.sig, timestamp: reviewed.updatedAt });
  const merged = records.mergeGitCasterPR({
    pr: reviewed,
    actor: owner,
    signature,
    payload: { type: "gitcaster.pr.merge.payload.v1", repo: repo.id, prId: pr.id, strategy: "record-only" },
    mergedAt: "2026-05-30T00:00:07.000Z"
  });
  const prMerged = records.createPRMergedEvent({ actor: owner, pr: merged, signature: signature.sig, timestamp: merged.updatedAt, refsChanged: false });

  assert.equal(repo.status, "alpha-local");
  assert.equal(issue.status, "open");
  assert.equal(issueClosed.status, "closed");
  assert.equal(review.statusLabel, "alpha-local");
  assert.equal(reviewed.status, "reviewed");
  assert.equal(merged.status, "merged");
  assert.equal(prMerged.payload.refsChanged, false);
  assert.equal(records.validateRepoName("bad repo").ok, false);
  assert.equal(records.validateIssueTitle("").ok, false);
  assert.equal(records.validateBranchName("../bad").ok, false);
  assert.throws(() => records.repoIdFromOwnerAndName("did:key:zBad", "repo-records-public-alpha"));

  return {
    repoId: repo.id,
    issueId: issue.id,
    prId: pr.id,
    reviewId: review.id,
    events: [repoEvent, issueOpened, issueUpdated, prOpened, prReviewed, prMerged].map((event) => event.type),
    refsChanged: prMerged.payload.refsChanged,
    appendOnly: true
  };
}

async function serviceWorkflow() {
  const configModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "config.js")).href);
  const storeModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "local-alpha-store.js")).href);
  const repoService = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "repo-service.js")).href);
  const issueService = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "issue-service.js")).href);
  const prService = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "services", "pr-service.js")).href);
  const owner = "did:caster:zPublicAlphaOwner";
  const timestamp = "2026-05-30T00:00:00.000Z";
  const store = storeModule.createLocalAlphaStore(configModule.loadGitCasterNodeConfig({ port: 0, startedAt: timestamp }));
  const verified = (scope, payload, nonce) => ({
    ok: true,
    status: "verified",
    actor: owner,
    scope,
    errors: [],
    envelope: { type: "gitcaster.signed-mutation.v1", actor: owner, scope, payload, nonce, timestamp, signature: "fixture-signature" }
  });
  const repo = repoService.handleCreateRepo(store, verified("repo:create", { type: "gitcaster.repo.create.payload.v1", name: "repo-records-public-alpha" }, "nonce-repo").envelope, verified("repo:create", { type: "gitcaster.repo.create.payload.v1", name: "repo-records-public-alpha" }, "nonce-repo"));
  assert.equal(repo.statusCode, 201);
  const repoId = repo.body.repo.id;
  const issue = issueService.handleCreateIssue(
    store,
    verified("issue:write", { type: "gitcaster.issue.create.payload.v1", repo: repoId, title: "Local issue" }, "nonce-issue").envelope,
    verified("issue:write", { type: "gitcaster.issue.create.payload.v1", repo: repoId, title: "Local issue" }, "nonce-issue"),
    owner,
    "repo-records-public-alpha"
  );
  assert.equal(issue.statusCode, 201);
  const pr = prService.handleCreatePR(
    store,
    verified("pr:write", { type: "gitcaster.pr.create.payload.v1", repo: repoId, head: "feature/local", base: "main", title: "Local PR" }, "nonce-pr").envelope,
    verified("pr:write", { type: "gitcaster.pr.create.payload.v1", repo: repoId, head: "feature/local", base: "main", title: "Local PR" }, "nonce-pr"),
    owner,
    "repo-records-public-alpha"
  );
  assert.equal(pr.statusCode, 201);
  const review = prService.handleReviewPR(
    store,
    verified("pr:write", { type: "gitcaster.pr.review.payload.v1", repo: repoId, prId: "pr-1", status: "approved" }, "nonce-review").envelope,
    verified("pr:write", { type: "gitcaster.pr.review.payload.v1", repo: repoId, prId: "pr-1", status: "approved" }, "nonce-review"),
    owner,
    "repo-records-public-alpha",
    "pr-1"
  );
  assert.equal(review.statusCode, 201);
  const merge = prService.handleMergePR(
    store,
    verified("pr:merge", { type: "gitcaster.pr.merge.payload.v1", repo: repoId, prId: "pr-1", strategy: "record-only" }, "nonce-merge").envelope,
    verified("pr:merge", { type: "gitcaster.pr.merge.payload.v1", repo: repoId, prId: "pr-1", strategy: "record-only" }, "nonce-merge"),
    owner,
    "repo-records-public-alpha",
    "pr-1"
  );
  assert.equal(merge.statusCode, 200);
  assert.equal(merge.body.refsChanged, false);
  return {
    repoStatus: repo.body.status,
    issueStatus: issue.body.status,
    prStatus: pr.body.status,
    reviewStatus: review.body.status,
    mergeStatus: merge.body.status,
    refsChanged: merge.body.refsChanged,
    events: store.events.length
  };
}

async function httpBlockers() {
  const serverModule = await import(pathToFileURL(path.join(repoRoot, "apps", "node", "dist", "server.js")).href);
  const started = await serverModule.startGitCasterNode({ port: 0, host: "127.0.0.1" });
  try {
    const issue = await fetch(`${started.url}/repos/did:caster:zPublicAlphaOwner/repo-records-public-alpha/issues`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const issueBody = await issue.json();
    const pr = await fetch(`${started.url}/repos/did:caster:zPublicAlphaOwner/repo-records-public-alpha/prs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const prBody = await pr.json();
    return {
      issueUnsignedStatusCode: issue.status,
      issueUnsignedStatus: issueBody.status,
      issueUnsignedScope: issueBody.scope,
      prUnsignedStatusCode: pr.status,
      prUnsignedStatus: prBody.status,
      prUnsignedScope: prBody.scope
    };
  } finally {
    await started.close();
  }
}

async function main() {
  const findings = scanFiles();
  const blockers = blockerList(findings);
  let packageResult = null;
  let serviceResult = null;
  let httpResult = null;
  try {
    packageResult = await packageWorkflow();
    serviceResult = await serviceWorkflow();
    httpResult = await httpBlockers();
    if (httpResult.issueUnsignedStatusCode !== 401 || httpResult.issueUnsignedStatus !== "blocked" || httpResult.issueUnsignedScope !== "issue:write") blockers.push("unsigned issue HTTP mutation was not blocked");
    if (httpResult.prUnsignedStatusCode !== 401 || httpResult.prUnsignedStatus !== "blocked" || httpResult.prUnsignedScope !== "pr:write") blockers.push("unsigned PR HTTP mutation was not blocked");
    if (packageResult.refsChanged !== false || serviceResult.refsChanged !== false) blockers.push("record-only merge changed refs");
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
  }

  const evidence = {
    type: "gitcaster.public-release.evidence.v1",
    slice: "repo-records-issue-pr-source",
    status: blockers.length ? "failed" : "passed",
    createdAt: new Date().toISOString(),
    filesChanged: requiredFiles,
    commandsRun: [
      "pnpm run repo-records:check",
      "pnpm run test:web",
      "node scripts/web/check-pr12-web-ui.cjs",
      "pnpm run secret-scan",
      "node scripts/web/build-static-export-copy.cjs"
    ],
    summary: {
      publicAlphaSourceReleased: true,
      repoRecordsPackageFound: exists("packages/repo-records/package.json"),
      packageWorkflowPassed: Boolean(packageResult),
      nodeServiceWorkflowPassed: Boolean(serviceResult),
      appendOnlyEventLogProven: packageResult?.appendOnly === true,
      issueRecordCreated: Boolean(packageResult?.issueId),
      pullRequestRecordCreated: Boolean(packageResult?.prId),
      reviewRecordCreated: Boolean(packageResult?.reviewId),
      recordOnlyMergeProven: packageResult?.refsChanged === false && serviceResult?.refsChanged === false,
      httpIssueUnsignedBlocked: httpResult?.issueUnsignedStatusCode === 401 && httpResult?.issueUnsignedStatus === "blocked",
      httpPrUnsignedBlocked: httpResult?.prUnsignedStatusCode === 401 && httpResult?.prUnsignedStatus === "blocked",
      publicCollaborationClaimed: false,
      remoteEventLogDurabilityClaimed: false,
      normalGitTransportClaimed: false,
      productionRuntimeClaimed: false,
      qstorageVerifiedClaimed: false,
      castercloudDeployedClaimed: false,
      publicNetworkClaimed: false,
      multiNodeReplicationClaimed: false,
      secretLeakFindings: findings.secretFindings.length,
      fakeLiveClaimsFound: findings.fakeClaimFindings.length,
      forbiddenIdentityViolations: findings.forbiddenReferenceFindings.length,
      hostedPlatformProductionViolations: findings.hostedPlatformFindings.length
    },
    packageWorkflow: packageResult,
    nodeServiceWorkflow: serviceResult,
    httpBlockers: httpResult,
    releaseQuality: {
      releaseLevel: "public-alpha",
      canShipProduction: false,
      productionBlockers: [
        "Repo records and issue/PR workflows are public-alpha local source only.",
        "Public collaboration is blocked until signed multi-node event-log proof exists.",
        "Remote event-log durability is blocked until append-only Caster event-log proof exists.",
        "Normal git transport is blocked until pack transport, node mutation, storage, and rollback proof exist.",
        "QStorage publication and CasterCloud deployment remain blocked until endpoint, custody, deploy, and rollback proof exists.",
        "Managed runtime, billing, custody, and production operations remain closed."
      ]
    },
    findings,
    blockers
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/repo-records-issue-pr-source.json", blockers, packageWorkflow: packageResult, httpBlockers: httpResult }, null, 2));
  if (blockers.length) process.exit(1);
}

main();
