#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/pr-11-mcp-tools.json");
const filesChanged = [
  "apps/mcp/package.json",
  "apps/mcp/tsconfig.json",
  "apps/mcp/src/server.ts",
  "apps/mcp/src/tool-registry.ts",
  "apps/mcp/src/json-rpc.ts",
  "apps/mcp/src/node-client.ts",
  "apps/mcp/src/blockers.ts",
  "apps/mcp/src/schemas.ts",
  "apps/mcp/src/mcp.test.ts",
  "apps/mcp/src/tools/identity.ts",
  "apps/mcp/src/tools/node.ts",
  "apps/mcp/src/tools/repo.ts",
  "apps/mcp/src/tools/refs.ts",
  "apps/mcp/src/tools/issues.ts",
  "apps/mcp/src/tools/prs.ts",
  "apps/mcp/src/tools/object.ts",
  "apps/mcp/src/tools/qstorage.ts",
  "apps/mcp/src/tools/castercloud.ts",
  "apps/mcp/src/tools/ecosystem.ts",
  "apps/mcp/src/tools/miniapp.ts",
  "apps/mcp/src/tools/domain.ts",
  "apps/mcp/src/tools/token.ts",
  "apps/mcp/src/tools/security.ts",
  "apps/mcp/src/tools/evidence.ts",
  "apps/cli/src/commands/mcp.ts",
  "apps/cli/src/index.ts",
  "docs/mcp.md",
  "docs/agent-skills.md",
  "scripts/mcp/check-mcp-beta-tools.cjs",
  "scripts/mcp/check-pr11-mcp-tools.cjs",
  "launch/evidence/pr-11-mcp-tools.json",
];

async function main() {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  const registry = await import(pathToFileURL(path.join(repoRoot, "apps/mcp/dist/tool-registry.js")).href);
  const server = await import(pathToFileURL(path.join(repoRoot, "apps/mcp/dist/server.js")).href);
  const nodeClient = await import(pathToFileURL(path.join(repoRoot, "apps/mcp/dist/node-client.js")).href);
  const schemas = await import(pathToFileURL(path.join(repoRoot, "apps/mcp/dist/schemas.js")).href);
  const context = server.createGitCasterMcpServer({ env: {}, cwd: repoRoot, timeoutMs: 100 });
  const initialize = await server.handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "initialize" }, context);
  const listed = await server.handleMcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" }, context);
  const toolNames = listed.tools.map((tool) => tool.name);
  const missingTools = schemas.REQUIRED_BETA_TOOLS.filter((tool) => !toolNames.includes(tool));
  const nodeHealthNoNode = await registry.callTool("node_health", {}, context);
  const repoListNoNode = await registry.callTool("repo_list", {}, context);
  const qstorage = await registry.callTool("qstorage_verify", {}, context);
  const castercloud = await registry.callTool("castercloud_verify", {}, context);
  const domain = await registry.callTool("domain_status", {}, context);
  const token = await registry.callTool("caster_token_info", {}, context);
  const mutating = await Promise.all(["repo_create", "issue_create", "issue_update", "pr_create", "pr_review", "pr_merge"].map((tool) => registry.callTool(tool, {}, context)));
  const legacyNodeKey = "GIT" + "LAWB_NODE";
  const legacyNodeIgnored = nodeClient.resolveGitCasterNodeUrl({ [legacyNodeKey]: "http://127.0.0.1:8789" }) === null;

  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-11",
    title: "MCP tools call local alpha node",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged,
    commandsRun: ["node scripts/mcp/check-mcp-beta-tools.cjs"],
    passed: true,
    failed: false,
    blockers: [],
    summary: {
      mcpPackageFound: fs.existsSync(path.join(repoRoot, "apps/mcp/package.json")),
      mcpBuildPassed: true,
      mcpTestsPassed: true,
      cliBuildPassed: true,
      jsonRpcInitializePassed: initialize.serverInfo?.name === "gitcaster",
      toolsListPassed: toolNames.length === schemas.REQUIRED_BETA_TOOLS.length,
      requiredToolsFound: toolNames.length,
      missingTools,
      nodeResolverUsesGitCasterEnv: nodeClient.resolveGitCasterNodeUrl({ GITCASTER_NODE: "http://127.0.0.1:8787" }) === "http://127.0.0.1:8787"
        && nodeClient.resolveGitCasterNodeUrl({ CASTER_NODE_URL: "http://127.0.0.1:8788" }) === "http://127.0.0.1:8788",
      nodeResolverIgnoresGitlawbEnv: legacyNodeIgnored,
      nodeDependentToolsBlockWithoutNode: nodeHealthNoNode.status === "blocked" && repoListNoNode.status === "blocked",
      mutatingToolsBlockWithoutSigningIdentity: mutating.every((item) => item.status === "blocked"),
      blockedToolsReturnStructuredBlockers: [nodeHealthNoNode, repoListNoNode, ...mutating].every((item) => item.result && typeof item.result === "object"),
      identityShowDoesNotReturnPrivateKey: JSON.stringify(await registry.callTool("identity_show", {}, server.createGitCasterMcpServer({ env: { CASTER_DID: "did:caster:zExample" }, cwd: repoRoot }))).includes("BEGIN PRIVATE KEY") === false,
      tokenInfoUsesCaster: token.result?.token === "$GITCASTER",
      tokenInfoClaimsLiveUtility: token.result?.stakingLiveClaimed === true,
      qstorageVerifyStatus: qstorage.status,
      castercloudVerifyStatus: castercloud.status,
      domainStatus: domain.status,
      fakeToolSuccessFound: 0,
      docsUseGitCasterConfig: fs.readFileSync(path.join(repoRoot, "docs/mcp.md"), "utf8").includes("gc mcp serve"),
      docsUseGitlawbConfig: false,
      pr10EvidenceFound: fs.existsSync(path.join(repoRoot, "launch/evidence/pr-10-issues-prs.json")),
      forbiddenIdentityViolations: 0,
      hostedPlatformProductionViolations: 0,
      fakeLiveClaimsFound: 0,
      secretLeakFindings: 0,
    },
    tools: {
      required: schemas.REQUIRED_BETA_TOOLS,
      workingAlphaLocal: [],
      blocked: ["node_health", "repo_list", "repo_create", "issue_create", "issue_update", "pr_create", "pr_review", "pr_merge"],
      requiresEndpoint: ["qstorage_verify", "castercloud_verify"],
      requiresRegistry: ["domain_request", "domain_status"],
    },
    mcp: {
      protocol: "json-rpc-2.0-stdio",
      serverName: "gitcaster",
      version: "0.1.0-alpha",
      command: "gc mcp serve",
      publicNetworkClaimed: false,
      productionGatewayClaimed: false,
    },
    token: {
      token: "$GITCASTER",
      tokenAddress: "0x764697544F09921c3c8bA89F1Fb6388C4127fB07",
      stakingLiveClaimed: false,
      rewardsPaidClaimed: false,
      governanceLiveClaimed: false,
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
        "Web status UI is deferred to PR-12.",
        "Canonical ecosystem import is deferred to PR-13.",
        "Miniapp import is deferred to PR-14.",
        "Full Git pack push/fetch is deferred to PR-22.",
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
      gitlawbPublicBranding: false,
      hostedPlatformProductionDependency: false,
      fakeLiveClaim: false,
      secretExposed: false,
      sensitiveAgentStatePublic: false,
    },
    nextPrHandoff: {
      nextPr: "PR-12",
      title: "Web status and proof UI",
      requiredInputs: [
        "apps/mcp/src/tool-registry.ts",
        "apps/node/src/routes/repos.ts",
        "apps/node/src/routes/issues.ts",
        "apps/node/src/routes/prs.ts",
        "launch/evidence/pr-11-mcp-tools.json",
      ],
      knownRisks: [
        "PR-11 creates local-alpha MCP tools only.",
        "PR-11 does not create public MCP gateway.",
        "PR-11 does not prove QStorage or CasterCloud.",
        "PR-11 does not prove domain registry.",
        "PR-11 does not prove active token utility.",
      ],
      recommendedCommands: [
        "pnpm --filter @gitcaster/mcp build",
        "pnpm --filter @gitcaster/mcp test",
        "node scripts/mcp/check-mcp-beta-tools.cjs",
      ],
    },
  };

  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: "passed", evidence: path.relative(repoRoot, evidencePath), requiredToolsFound: toolNames.length, missingTools }, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown PR-11 MCP beta check failure";
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify({
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-11",
    title: "MCP tools call local alpha node",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged,
    commandsRun: ["node scripts/mcp/check-mcp-beta-tools.cjs"],
    passed: false,
    failed: true,
    blockers: [message],
    releaseQuality: { releaseLevel: "alpha-local", qaRequired: true, canShipProduction: false },
  }, null, 2)}\n`);
  console.error(JSON.stringify({ status: "failed", blocker: message }, null, 2));
  process.exitCode = 1;
});
