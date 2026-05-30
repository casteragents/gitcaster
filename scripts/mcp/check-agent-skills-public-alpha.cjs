#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/agent-skills-public-alpha.json");
const publicJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-agent-skills.json");
const publicMdPath = path.join(repoRoot, "apps/web/public/gitcaster-agent-skills.md");

const requiredFiles = [
  "apps/mcp/src/tool-registry.ts",
  "apps/mcp/src/schemas.ts",
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
  "examples/mcp/local-tool-plan.example.json",
  "docs/agent-skills.md",
  "apps/web/public/agent-skills.md",
  "apps/web/app/open-source/agent-skills/page.tsx",
  "docs-source/developer-layers/agent-skills.md",
  "scripts/mcp/check-agent-skills-public-alpha.cjs"
];

const fakeClaimPattern = /(public MCP gateway ready|managed signing custody enabled|public node mutation enabled|QStorage verified|CasterCloud verified|\.caster mapped|staking live|rewards paid|governance live|production-ready|public nodes online|multi-node replicated|live decentralized network)/i;
const secretPattern = /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|seed phrase|mnemonic|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/;
const legacyPattern = /(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i;
const skipContentScan = new Set(["scripts/mcp/check-agent-skills-public-alpha.cjs"]);

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const blockers = [];
  const missingFiles = requiredFiles.filter((file) => !exists(file));
  for (const file of missingFiles) blockers.push(`missing file: ${file}`);

  const scannedFiles = requiredFiles.filter((file) => exists(file));
  const findings = {
    secretFindings: [],
    legacyFindings: [],
    fakeClaimFindings: []
  };

  for (const file of scannedFiles) {
    const text = read(file);
    if (skipContentScan.has(file)) continue;
    const intentionalSecretMarkerCode = file === "apps/mcp/src/tools/identity.ts" && text.includes("secretMarkers") && text.includes("[redacted]");
    if (secretPattern.test(text) && !intentionalSecretMarkerCode) findings.secretFindings.push({ file, reason: "secret-like content found" });
    if (legacyPattern.test(text)) findings.legacyFindings.push({ file, reason: "legacy identity string found" });
    if (fakeClaimPattern.test(text)) findings.fakeClaimFindings.push({ file, reason: "unsupported runtime claim found" });
  }
  for (const finding of [...findings.secretFindings, ...findings.legacyFindings, ...findings.fakeClaimFindings]) {
    blockers.push(`${finding.file}: ${finding.reason}`);
  }

  const docs = exists("docs/agent-skills.md") ? read("docs/agent-skills.md") : "";
  const publicDocs = exists("apps/web/public/agent-skills.md") ? read("apps/web/public/agent-skills.md") : "";
  const fixture = exists("examples/mcp/local-tool-plan.example.json") ? JSON.parse(read("examples/mcp/local-tool-plan.example.json")) : {};
  const schemas = exists("apps/mcp/dist/schemas.js")
    ? await import(pathToFileURL(path.join(repoRoot, "apps/mcp/dist/schemas.js")).href)
    : null;
  const requiredTools = schemas?.REQUIRED_BETA_TOOLS || [];

  if (!docs.includes("local inspection only")) blockers.push("docs/agent-skills.md must state local inspection only");
  if (!publicDocs.includes("local inspection only")) blockers.push("apps/web/public/agent-skills.md must state local inspection only");
  if (!docs.includes("managed signing custody") || !docs.includes("private credentials")) blockers.push("agent skills docs must list reserved managed layers");
  if (!Array.isArray(requiredTools) || requiredTools.length !== 31) blockers.push("MCP required tool catalog must contain 31 beta tools");
  if (fixture?.status !== "public-alpha") blockers.push("local MCP tool plan fixture must remain public-alpha");
  if (fixture?.toolRuntime !== "alpha-local") blockers.push("local MCP tool plan fixture runtime must remain alpha-local");
  if (fixture?.publicGatewayClaimed !== false) blockers.push("local MCP tool plan fixture must not claim public gateway");
  if (fixture?.productionGatewayClaimed !== false) blockers.push("local MCP tool plan fixture must not claim production gateway");
  if (!JSON.stringify(fixture?.blockedUntilProof || []).includes("managed signing custody")) blockers.push("local MCP tool plan fixture must keep managed signing custody blocked");

  const blockedClaims = [
    "public MCP gateway endpoint",
    "managed signing custody",
    "public node mutation",
    "QStorage publication",
    "native domain routing",
    "production runtime operation"
  ];
  const publicArtifacts = [
    "apps/mcp/src/tool-registry.ts",
    "apps/mcp/src/schemas.ts",
    "apps/mcp/src/tools",
    "examples/mcp/local-tool-plan.example.json",
    "docs/agent-skills.md"
  ];

  const publicJson = {
    type: "gitcaster.agent-skills.public-alpha.v1",
    status: blockers.length === 0 ? "passed" : "failed",
    createdAt: new Date().toISOString(),
    localInspectionOnly: true,
    publicAlphaOnly: true,
    requiredToolCount: requiredTools.length,
    publicArtifacts,
    blockedClaims,
    commandsRun: ["pnpm --filter @gitcaster/mcp build", "node scripts/mcp/check-agent-skills-public-alpha.cjs"],
    blockers
  };

  const publicMd = [
    "# GitCaster agent skills layer",
    "",
    "Status: public-alpha, local inspection only",
    "",
    "This layer documents the agent-facing MCP skill catalog for local review.",
    "It exposes tool names, schemas, structured blocker behavior, and a placeholder-only local tool plan.",
    "",
    "Public artifacts:",
    "",
    ...publicArtifacts.map((item) => `- \`${item}\``),
    "",
    "Blocked claims:",
    "",
    ...blockedClaims.map((item) => `- ${item}`),
    "",
    "Verification:",
    "",
    "```bash",
    "pnpm run agent-skills:check",
    "```",
    ""
  ].join("\n");

  writeJson(publicJsonPath, publicJson);
  fs.mkdirSync(path.dirname(publicMdPath), { recursive: true });
  fs.writeFileSync(publicMdPath, publicMd);

  const evidence = {
    type: "gitcaster.agent-skills.evidence.v1",
    title: "Agent skills public-alpha layer",
    createdAt: new Date().toISOString(),
    status: blockers.length === 0 ? "passed" : "failed",
    repoRoot,
    filesChanged: requiredFiles.concat([
      "apps/web/public/gitcaster-agent-skills.json",
      "apps/web/public/gitcaster-agent-skills.md",
      "launch/evidence/agent-skills-public-alpha.json"
    ]),
    commandsRun: ["pnpm --filter @gitcaster/mcp build", "node scripts/mcp/check-agent-skills-public-alpha.cjs"],
    blockers,
    findings,
    summary: {
      localInspectionOnly: true,
      publicAlphaOnly: true,
      sourceFilesFound: missingFiles.length === 0,
      requiredToolCount: requiredTools.length,
      fixturePublicAlpha: fixture?.status === "public-alpha",
      fixtureAlphaLocalRuntime: fixture?.toolRuntime === "alpha-local",
      publicGatewayClaimed: false,
      managedSigningCustodyClaimed: false,
      publicNodeMutationClaimed: false,
      qstoragePublicationClaimed: false,
      nativeDomainClaimed: false,
      productionRuntimeClaimed: false,
      secretLeakFindings: findings.secretFindings.length,
      legacyFindings: findings.legacyFindings.length,
      fakeClaimFindings: findings.fakeClaimFindings.length
    },
    publicJson: path.relative(repoRoot, publicJsonPath).replaceAll("\\", "/"),
    publicMarkdown: path.relative(repoRoot, publicMdPath).replaceAll("\\", "/"),
    nextProof: "Public gateway, managed custody, node mutation, storage, domain, rollback, and release-candidate proof"
  };

  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/agent-skills-public-alpha.json", publicJson: "apps/web/public/gitcaster-agent-skills.json", blockers }, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  writeJson(evidencePath, {
    type: "gitcaster.agent-skills.evidence.v1",
    title: "Agent skills public-alpha layer",
    createdAt: new Date().toISOString(),
    status: "failed",
    blockers: [message]
  });
  console.error(JSON.stringify({ status: "failed", blocker: message }, null, 2));
  process.exitCode = 1;
});
