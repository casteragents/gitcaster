#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/protocol-types-public-alpha.json");
const publicJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-protocol-types.json");
const publicMdPath = path.join(repoRoot, "apps/web/public/gitcaster-protocol-types.md");
const publicSmokeEvidencePath = path.join(repoRoot, "launch/evidence/protocol-types-public-smoke.json");
const publicSmokeJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-protocol-types-public-smoke.json");
const currentTokenAddress = "0x764697544F09921c3c8bA89F1Fb6388C4127fB07";

const requiredFiles = [
  "packages/protocol/src/types.ts",
  "packages/protocol/src/events.ts",
  "packages/protocol/src/status.ts",
  "packages/protocol/src/content-types.ts",
  "packages/protocol/src/error-codes.ts",
  "packages/protocol/src/fixtures.ts",
  "examples/protocol/local-protocol-envelope.example.json",
  "docs/protocol-types.md",
  "apps/web/public/protocol-types.md",
  "apps/web/app/open-source/protocol-types/page.tsx",
  "docs-source/developer-layers/protocol-types.md",
  "scripts/protocol/check-fixtures.cjs",
  "scripts/protocol/check-protocol-types-public-alpha.cjs",
  "scripts/protocol/check-protocol-types-public-smoke.cjs"
];

const secretPattern = /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|seed phrase|mnemonic|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/;
const legacyPattern = /(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i;
const fakeClaimPattern = /(public runtime ready|managed signing custody enabled|public node mutation enabled|QStorage verified|CasterCloud verified|\.caster mapped|staking live|rewards paid|governance live|production-ready|public nodes online|multi-node replicated|live decentralized network)/i;
const skipContentScan = new Set([
  "scripts/protocol/check-fixtures.cjs",
  "scripts/protocol/check-protocol-types-public-alpha.cjs"
]);

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

async function importDist(name) {
  return import(pathToFileURL(path.join(repoRoot, "packages/protocol/dist", name)).href);
}

async function main() {
  const blockers = [];
  const missingFiles = requiredFiles.filter((file) => !exists(file));
  for (const file of missingFiles) blockers.push(`missing file: ${file}`);

  const findings = { secretFindings: [], legacyFindings: [], fakeClaimFindings: [] };
  for (const file of requiredFiles.filter(exists)) {
    if (skipContentScan.has(file)) continue;
    const text = read(file);
    if (secretPattern.test(text)) findings.secretFindings.push({ file, reason: "secret-like content found" });
    if (legacyPattern.test(text)) findings.legacyFindings.push({ file, reason: "legacy identity string found" });
    if (fakeClaimPattern.test(text)) findings.fakeClaimFindings.push({ file, reason: "unsupported runtime claim found" });
  }
  for (const finding of [...findings.secretFindings, ...findings.legacyFindings, ...findings.fakeClaimFindings]) blockers.push(`${finding.file}: ${finding.reason}`);

  const fixture = exists("examples/protocol/local-protocol-envelope.example.json")
    ? JSON.parse(read("examples/protocol/local-protocol-envelope.example.json"))
    : {};
  const typesText = exists("packages/protocol/src/types.ts") ? read("packages/protocol/src/types.ts") : "";
  const docsText = exists("docs/protocol-types.md") ? read("docs/protocol-types.md") : "";
  const publicDocsText = exists("apps/web/public/protocol-types.md") ? read("apps/web/public/protocol-types.md") : "";
  const events = await importDist("events.js");
  const statuses = await importDist("status.js");
  const contentTypes = await importDist("content-types.js");
  const errors = await importDist("error-codes.js");
  const fixtures = await importDist("fixtures.js");

  if (!docsText.includes("local inspection only")) blockers.push("docs/protocol-types.md must state local inspection only");
  if (!publicDocsText.includes("local inspection only")) blockers.push("apps/web/public/protocol-types.md must state local inspection only");
  if (fixture?.status !== "public-alpha") blockers.push("protocol example must remain public-alpha");
  if (fixture?.runtime !== "alpha-local") blockers.push("protocol example runtime must remain alpha-local");
  if (fixture?.scope !== "schema-inspection-only") blockers.push("protocol example scope must remain schema-inspection-only");
  for (const claim of ["canonicalRuntimeClaimed", "publicNodeMutationClaimed", "qstoragePublished", "nativeDomainClaimed", "managedCustodyClaimed", "productionRuntimeClaimed"]) {
    if (fixture?.claims?.[claim] !== false) blockers.push(`protocol example claim ${claim} must remain false`);
  }
  if (!typesText.includes('token: "$GITCASTER"')) blockers.push("protocol reward type must use $GITCASTER");
  if (!typesText.includes(`tokenAddress: "${currentTokenAddress}"`)) blockers.push("protocol reward type must use the current public contract address");
  if (typesText.includes('token: "$CASTER"')) blockers.push("protocol reward type still includes obsolete $CASTER symbol");
  if ((events.GITCASTER_EVENTS || []).length !== 22) blockers.push("protocol event catalog must contain 22 entries");
  if ((statuses.GITCASTER_STATUSES || []).length !== 14) blockers.push("protocol status catalog must contain 14 entries");
  if ((contentTypes.GITCASTER_CONTENT_TYPES || []).length !== 12) blockers.push("protocol content type catalog must contain 12 entries");
  if ((errors.GITCASTER_ERROR_CODES || []).length !== 25) blockers.push("protocol error catalog must contain 25 entries");
  if ((fixtures.GITCASTER_PROTOCOL_FIXTURES || []).length !== 5) blockers.push("protocol fixture catalog must contain 5 entries");

  const blockedClaims = [
    "public runtime endpoint",
    "managed signing custody",
    "public node mutation",
    "QStorage publication",
    "native domain routing",
    "production runtime operation"
  ];
  const publicArtifacts = [
    "packages/protocol/src/types.ts",
    "packages/protocol/src/events.ts",
    "packages/protocol/src/status.ts",
    "packages/protocol/src/content-types.ts",
    "packages/protocol/src/error-codes.ts",
    "packages/protocol/src/fixtures.ts",
    "examples/protocol/local-protocol-envelope.example.json",
    "docs/protocol-types.md"
  ];

  const publicJson = {
    type: "gitcaster.protocol-types.public-alpha.v1",
    status: blockers.length === 0 ? "passed" : "failed",
    createdAt: new Date().toISOString(),
    localInspectionOnly: true,
    publicAlphaOnly: true,
    token: { symbol: "$GITCASTER", address: currentTokenAddress, utilityStatus: "proof-only" },
    catalogs: {
      events: (events.GITCASTER_EVENTS || []).length,
      statuses: (statuses.GITCASTER_STATUSES || []).length,
      contentTypes: (contentTypes.GITCASTER_CONTENT_TYPES || []).length,
      errorCodes: (errors.GITCASTER_ERROR_CODES || []).length,
      fixtures: (fixtures.GITCASTER_PROTOCOL_FIXTURES || []).length
    },
    publicArtifacts,
    blockedClaims,
    commandsRun: ["pnpm --filter @gitcaster/protocol build", "node scripts/protocol/check-fixtures.cjs", "node scripts/protocol/check-protocol-types-public-alpha.cjs"],
    blockers
  };
  const publicMd = [
    "# GitCaster protocol types layer",
    "",
    "Status: public-alpha, local inspection only",
    "",
    "This layer publishes GitCaster protocol vocabulary for contributor review.",
    "It exposes typed contracts, fixture names, and a placeholder-only local envelope example.",
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
    "pnpm run protocol-types:check",
    "pnpm run protocol-types:public-smoke",
    "```",
    ""
  ].join("\n");
  writeJson(publicJsonPath, publicJson);
  fs.mkdirSync(path.dirname(publicMdPath), { recursive: true });
  fs.writeFileSync(publicMdPath, publicMd);
  if (!fs.existsSync(publicSmokeEvidencePath) || !fs.existsSync(publicSmokeJsonPath)) {
    const pendingSmoke = {
      type: "gitcaster.protocol-types.public-smoke.v1",
      status: "blocked_external",
      publicDeliveryOnly: true,
      managedRuntimeClaimed: false,
      createdAt: new Date().toISOString(),
      results: [],
      blockers: ["Public delivery smoke must run after publication"]
    };
    writeJson(publicSmokeEvidencePath, pendingSmoke);
    writeJson(publicSmokeJsonPath, pendingSmoke);
  }

  const evidence = {
    type: "gitcaster.protocol-types.evidence.v1",
    title: "Protocol types public-alpha layer",
    createdAt: new Date().toISOString(),
    status: blockers.length === 0 ? "passed" : "failed",
    repoRoot,
    filesChanged: requiredFiles.concat([
      "apps/web/public/gitcaster-protocol-types.json",
      "apps/web/public/gitcaster-protocol-types.md",
      "launch/evidence/protocol-types-public-alpha.json"
    ]),
    commandsRun: publicJson.commandsRun,
    blockers,
    findings,
    summary: {
      localInspectionOnly: true,
      publicAlphaOnly: true,
      sourceFilesFound: missingFiles.length === 0,
      examplePublicAlpha: fixture?.status === "public-alpha",
      exampleAlphaLocalRuntime: fixture?.runtime === "alpha-local",
      tokenSymbol: "$GITCASTER",
      tokenAddress: currentTokenAddress,
      canonicalRuntimeClaimed: false,
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
    nextProof: "Published package artifact, downstream compatibility checks, public runtime endpoint, managed custody, storage, domain, rollback, and release-candidate proof"
  };
  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/protocol-types-public-alpha.json", publicJson: "apps/web/public/gitcaster-protocol-types.json", blockers }, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  const blocker = error instanceof Error ? error.message : String(error);
  writeJson(evidencePath, { type: "gitcaster.protocol-types.evidence.v1", title: "Protocol types public-alpha layer", createdAt: new Date().toISOString(), status: "failed", blockers: [blocker] });
  console.error(JSON.stringify({ status: "failed", blocker }, null, 2));
  process.exitCode = 1;
});
