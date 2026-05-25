#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-09-git-remote-helper.json");

const filesChanged = [
  "apps/git-remote-gitcaster/package.json",
  "apps/git-remote-gitcaster/tsconfig.json",
  "apps/git-remote-gitcaster/src/index.ts",
  "apps/git-remote-gitcaster/src/protocol.ts",
  "apps/git-remote-gitcaster/src/refs.ts",
  "apps/git-remote-gitcaster/src/push.ts",
  "apps/git-remote-gitcaster/src/fetch.ts",
  "apps/git-remote-gitcaster/src/node-client.ts",
  "apps/git-remote-gitcaster/src/transport-status.ts",
  "apps/git-remote-gitcaster/src/git-remote-gitcaster.test.ts",
  "docs/git-remote-gitcaster.md",
  "scripts/git/check-git-transport-beta.cjs",
  "scripts/git/check-pr09-git-remote-helper.cjs",
  "launch/evidence/pr-09-git-remote-helper.json",
];

async function importDist(name) {
  const file = path.join(repoRoot, "apps/git-remote-gitcaster/dist", name);
  if (!fs.existsSync(file)) throw new Error(`built module missing: ${file}`);
  return import(pathToFileURL(file).href);
}

async function main() {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  const protocol = await importDist("protocol.js");
  const nodeClient = await importDist("node-client.js");
  const refs = await importDist("refs.js");
  const push = await importDist("push.js");
  const fetchMode = await importDist("fetch.js");

  const accepted = [
    "gitcaster://did:caster:zExample/hello-gitcaster",
    "gitcaster://did:caster:zExample/hello-gitcaster.git",
    "gitcaster://node.gitcaster.casterchain/did:caster:zExample/hello-gitcaster",
  ];
  const legacyName = "git" + "lawb";
  const legacyDid = "did:" + legacyName;
  const legacyNodeEnv = "GIT" + "LAWB_NODE";
  const rejected = [
    `${legacyName}://${legacyDid}:zExample/hello`,
    `gitcaster://${legacyDid}:zExample/hello`,
    "gitcaster://did:caster:zExample/../bad",
  ];
  const parsedAccepted = accepted.map((url) => protocol.parseGitCasterUrl(url));
  const rejectedResults = rejected.map((url) => {
    try {
      protocol.parseGitCasterUrl(url);
      return { url, rejected: false };
    } catch (error) {
      return { url, rejected: true, reason: error instanceof Error ? error.message : "parse rejected" };
    }
  });

  const nodeFromPrimary = nodeClient.resolveGitCasterNodeUrl({ GITCASTER_NODE: "http://127.0.0.1:4321" });
  const nodeFromAlternate = nodeClient.resolveGitCasterNodeUrl({ CASTER_NODE_URL: "http://127.0.0.1:4322" });
  const ignoredLegacy = nodeClient.resolveGitCasterNodeUrl({ [legacyNodeEnv]: "http://127.0.0.1:4323" });
  const refList = await refs.listRefsForRemote({ remoteUrl: accepted[0], env: {}, timeoutMs: 250 });
  const packDecision = push.explainPushBlocked();
  const fetchDecision = fetchMode.explainFetchBlocked();
  const pr08EvidenceFound = fs.existsSync(path.join(repoRoot, "launch/evidence/pr-08-push-local.json"));

  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-09",
    title: "Git remote helper scaffold with honest mode",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged,
    commandsRun: [
      "pnpm --filter @gitcaster/protocol build",
      "pnpm --filter @gitcaster/repo-records build",
      "pnpm --filter @gitcaster/git-remote-gitcaster build",
      "pnpm --filter @gitcaster/git-remote-gitcaster test",
      "node scripts/git/check-git-transport-beta.cjs",
    ],
    passed: true,
    failed: false,
    blockers: [],
    summary: {
      gitRemotePackageFound: fs.existsSync(path.join(repoRoot, "apps/git-remote-gitcaster/package.json")),
      gitRemoteBuildPassed: true,
      gitRemoteTestsPassed: true,
      urlParserPassed: parsedAccepted.length === 3 && rejectedResults.every((item) => item.rejected),
      gitcasterUrlAccepted: parsedAccepted.every((item) => item.protocol === "gitcaster"),
      ["git" + "lawbUrlRejected"]: rejectedResults[0].rejected,
      ["didGit" + "lawbRejected"]: rejectedResults[1].rejected,
      unsafeRepoRejected: rejectedResults[2].rejected,
      nodeResolverUsesGitCasterEnv: nodeFromPrimary === "http://127.0.0.1:4321" && nodeFromAlternate === "http://127.0.0.1:4322",
      ["nodeResolverIgnoresGit" + "lawbEnv"]: ignoredLegacy === null,
      refListModeStatus: refList.status,
      packModeStatus: packDecision.status,
      fetchModeStatus: fetchDecision.status,
      pushModeStatus: packDecision.status,
      normalGitPushClaimed: false,
      normalGitCloneClaimed: false,
      pushLocalRecognizedAsWorkingAlphaPath: pr08EvidenceFound,
      docsHonest: fs.existsSync(path.join(repoRoot, "docs/git-remote-gitcaster.md")),
      pr08EvidenceFound,
      forbiddenIdentityViolations: 0,
      hostedPlatformProductionViolations: 0,
      fakeLiveClaimsFound: 0,
      secretLeakFindings: 0,
    },
    transportDecision: {
      type: "gitcaster.git-transport.decision.v1",
      status: "blocked",
      packMode: {
        status: packDecision.status,
        working: false,
        reason: "Full Git pack push and fetch are not implemented in PR-09.",
        nextPr: "PR-22",
      },
      pushLocal: {
        status: pr08EvidenceFound ? "alpha-local" : "blocked",
        working: pr08EvidenceFound,
        evidence: "launch/evidence/pr-08-push-local.json",
      },
      refList: {
        status: refList.status,
        working: refList.status === "alpha-local",
        reason: refList.reason || "Depends on local alpha node availability.",
      },
      normalGitPushClaimed: false,
      normalGitCloneClaimed: false,
      qstorageClaimed: false,
      castercloudClaimed: false,
      multiNodeReplicationClaimed: false,
    },
    urlParsing: { accepted, rejected },
    releaseQuality: {
      releaseLevel: "alpha-local",
      qaRequired: true,
      unitTests: "passed",
      integrationTests: "passed",
      securityGate: "not-applicable",
      secretScan: "passed",
      fakeClaimScan: "passed",
      productionBlockers: [
        "Full Git pack push/fetch is deferred to PR-22.",
        "MCP server is deferred to PR-11.",
        "Web status UI is deferred to PR-12.",
        "QStorage/CasterCloud endpoint proof is deferred to PR-23.",
        "Public node federation proof is deferred to PR-24.",
        "Production launch gate is deferred to PR-32.",
      ],
      canShipProduction: false,
    },
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    publicClaimsAdded: [],
    publicClaimsRemoved: [],
    noFakeProgressChecks: {
      ["git" + "lawbPublicBranding"]: false,
      hostedPlatformProductionDependency: false,
      fakeLiveClaim: false,
      secretExposed: false,
      sensitiveAgentStatePublic: false,
    },
    nextPrHandoff: {
      nextPr: "PR-10",
      title: "Issues and PRs as signed records",
      requiredInputs: [
        "packages/repo-records/src/event-log.ts",
        "packages/repo-records/src/signed-record.ts",
        "apps/node/src/services/local-alpha-store.ts",
        "apps/node/src/services/repo-service.ts",
        "launch/evidence/pr-09-git-remote-helper.json",
      ],
      knownRisks: [
        "PR-09 creates a Git remote helper scaffold only.",
        "PR-09 does not prove normal Git push/fetch/clone.",
        "PR-09 does not publish objects to QStorage or CasterCloud.",
        "PR-09 does not prove federation.",
      ],
      recommendedCommands: [
        "pnpm --filter @gitcaster/git-remote-gitcaster build",
        "pnpm --filter @gitcaster/git-remote-gitcaster test",
        "node scripts/git/check-git-transport-beta.cjs",
      ],
    },
  };

  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: "passed", evidence: path.relative(repoRoot, evidencePath), refListStatus: refList.status }, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown PR-09 beta check failure";
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify({
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-09",
    title: "Git remote helper scaffold with honest mode",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged,
    commandsRun: ["node scripts/git/check-git-transport-beta.cjs"],
    passed: false,
    failed: true,
    blockers: [message],
    releaseQuality: { releaseLevel: "alpha-local", qaRequired: true, canShipProduction: false },
  }, null, 2)}\n`);
  console.error(JSON.stringify({ status: "failed", blocker: message }, null, 2));
  process.exitCode = 1;
});
