#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch/evidence/casterdid-identity-public-alpha.json");
const publicJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-casterdid-identity.json");
const publicMdPath = path.join(repoRoot, "apps/web/public/gitcaster-casterdid-identity.md");
const publicSmokeEvidencePath = path.join(repoRoot, "launch/evidence/casterdid-identity-public-smoke.json");
const publicSmokeJsonPath = path.join(repoRoot, "apps/web/public/gitcaster-casterdid-identity-public-smoke.json");

const requiredFiles = [
  "packages/identity/package.json",
  "packages/identity/tsconfig.json",
  "packages/identity/src/index.ts",
  "packages/identity/src/did-caster.ts",
  "packages/identity/src/ed25519.ts",
  "packages/identity/src/key-storage.ts",
  "packages/identity/src/signature-envelope.ts",
  "packages/identity/src/canonical-json.ts",
  "packages/identity/src/identity.test.ts",
  "examples/identity/local-casterdid-identity.example.json",
  "docs/casterdid-identity.md",
  "apps/web/public/casterdid-identity.md",
  "apps/web/app/open-source/casterdid-identity/page.tsx",
  "docs-source/developer-layers/casterdid-identity.md",
  "scripts/identity/check-casterdid-identity-public-alpha.cjs",
  "scripts/identity/check-casterdid-identity-public-smoke.cjs"
];

const publicArtifacts = [
  "packages/identity/src/did-caster.ts",
  "packages/identity/src/ed25519.ts",
  "packages/identity/src/key-storage.ts",
  "packages/identity/src/signature-envelope.ts",
  "packages/identity/src/canonical-json.ts",
  "examples/identity/local-casterdid-identity.example.json",
  "docs/casterdid-identity.md"
];

const blockedClaims = [
  "managed signing custody",
  "operator private keys",
  "public runtime endpoint",
  "public node mutation",
  "storage publication",
  "native domain routing",
  "production runtime operation"
];

const secretPattern = /(-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|seed phrase|mnemonic|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/;
const legacyPattern = /(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i;
const hostedPattern = /(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i;
const fakeClaimPattern = /(managed signing custody enabled|public runtime ready|public node mutation enabled|QStorage verified|CasterCloud verified|\.caster mapped|staking live|rewards paid|governance live|production-ready|public nodes online|multi-node replicated|live decentralized network)/i;
const skipContentScan = new Set(["scripts/identity/check-casterdid-identity-public-alpha.cjs"]);

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
  return import(pathToFileURL(path.join(repoRoot, "packages/identity/dist", name)).href);
}

async function main() {
  const blockers = [];
  const missingFiles = requiredFiles.filter((file) => !exists(file));
  for (const file of missingFiles) blockers.push(`missing file: ${file}`);

  const findings = { secretFindings: [], legacyFindings: [], hostedFindings: [], fakeClaimFindings: [] };
  for (const file of requiredFiles.filter(exists)) {
    if (skipContentScan.has(file)) continue;
    const text = read(file);
    if (secretPattern.test(text)) findings.secretFindings.push({ file, reason: "secret-like content found" });
    if (legacyPattern.test(text)) findings.legacyFindings.push({ file, reason: "legacy identity string found" });
    if (hostedPattern.test(text)) findings.hostedFindings.push({ file, reason: "hosted platform dependency claim found" });
    if (fakeClaimPattern.test(text)) findings.fakeClaimFindings.push({ file, reason: "unsupported runtime claim found" });
  }
  for (const finding of [...findings.secretFindings, ...findings.legacyFindings, ...findings.hostedFindings, ...findings.fakeClaimFindings]) {
    blockers.push(`${finding.file}: ${finding.reason}`);
  }

  const fixture = exists("examples/identity/local-casterdid-identity.example.json")
    ? JSON.parse(read("examples/identity/local-casterdid-identity.example.json"))
    : {};
  const docsText = exists("docs/casterdid-identity.md") ? read("docs/casterdid-identity.md") : "";
  const publicDocsText = exists("apps/web/public/casterdid-identity.md") ? read("apps/web/public/casterdid-identity.md") : "";
  if (!docsText.includes("local identity inspection only")) blockers.push("docs/casterdid-identity.md must state local identity inspection only");
  if (!publicDocsText.includes("local identity inspection only")) blockers.push("apps/web/public/casterdid-identity.md must state local identity inspection only");
  if (fixture?.status !== "public-alpha") blockers.push("identity example must remain public-alpha");
  if (fixture?.runtime !== "alpha-local") blockers.push("identity example runtime must remain alpha-local");
  if (fixture?.scope !== "local-identity-inspection-only") blockers.push("identity example scope must remain local-identity-inspection-only");
  for (const claim of ["privateKeyIncluded", "managedCustodyClaimed", "publicRuntimeClaimed", "publicNodeMutationClaimed", "qstoragePublished", "nativeDomainClaimed", "productionRuntimeClaimed"]) {
    if (fixture?.[claim] !== false) blockers.push(`identity example claim ${claim} must remain false`);
  }
  if (JSON.stringify(fixture).includes("BEGIN PRIVATE KEY")) blockers.push("identity example must not include a private key");

  const identity = await importDist("index.js");
  const keys = identity.generateEd25519KeyPair();
  const did = identity.createCasterDIDFromPublicKey(keys.publicKeyPem, "agent");
  const didDocument = identity.createCasterDIDDocument({ did: did.id, publicKeyPem: keys.publicKeyPem, kind: "agent", createdAt: "2026-05-31T00:00:00.000Z" });
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "gitcaster-casterdid-public-alpha-"));
  const writeResult = identity.writeIdentityFiles({ homeOverride: tempHome, did: did.id, kind: "agent", publicKeyPem: keys.publicKeyPem, privateKeyPem: keys.privateKeyPem });
  const readResult = identity.readIdentityFiles(tempHome);
  const envelope = identity.createSignedMutationEnvelope({
    actor: did.id,
    privateKeyPem: keys.privateKeyPem,
    payload: { type: "gitcaster.repo.create.payload.v1", name: "casterdid-local" },
    nonce: "casterdid-public-alpha"
  });
  const signedMutationVerified = identity.verifySignedMutationEnvelope({ envelope, publicKeyPem: keys.publicKeyPem }).ok;
  const tamperedMutationFailed = !identity.verifySignedMutationEnvelope({ envelope: { ...envelope, payload: { type: "gitcaster.repo.create.payload.v1", name: "tampered" } }, publicKeyPem: keys.publicKeyPem }).ok;
  const wrongKeys = identity.generateEd25519KeyPair();
  const wrongKeyFailed = !identity.verifySignedMutationEnvelope({ envelope, publicKeyPem: wrongKeys.publicKeyPem }).ok;
  const didCreated = identity.isCasterDID(did.id) && did.status === "alpha-local";
  const didDocumentCreated = didDocument.id === did.id && didDocument.verificationMethod.length === 1 && !JSON.stringify(didDocument).includes("BEGIN PRIVATE KEY");
  const identityFilesRoundTrip = readResult.didDocument.id === did.id && readResult.publicKeyPem === keys.publicKeyPem && writeResult.privateKeyMode;

  if (!didCreated) blockers.push("local did creation failed");
  if (!didDocumentCreated) blockers.push("local did document creation failed");
  if (!signedMutationVerified) blockers.push("signed mutation verification failed");
  if (!tamperedMutationFailed) blockers.push("tampered mutation did not fail");
  if (!wrongKeyFailed) blockers.push("wrong key verification did not fail");
  if (!identityFilesRoundTrip) blockers.push("identity file round trip failed");

  const commandsRun = [
    "pnpm --filter @gitcaster/protocol build",
    "pnpm --filter @gitcaster/identity build",
    "pnpm --filter @gitcaster/identity test",
    "node scripts/identity/check-casterdid-identity-public-alpha.cjs"
  ];
  const publicJson = {
    type: "gitcaster.casterdid-identity.public-alpha.v1",
    status: blockers.length === 0 ? "passed" : "failed",
    createdAt: new Date().toISOString(),
    localIdentityInspectionOnly: true,
    publicAlphaOnly: true,
    publicArtifacts,
    blockedClaims,
    summary: {
      didCreated,
      didDocumentCreated,
      signedMutationVerified,
      tamperedMutationFailed,
      wrongKeyFailed,
      identityFilesRoundTrip: Boolean(identityFilesRoundTrip),
      privateKeyPublished: false,
      managedCustodyClaimed: false,
      publicRuntimeClaimed: false,
      publicNodeMutationClaimed: false,
      storagePublicationClaimed: false,
      nativeDomainClaimed: false,
      productionRuntimeClaimed: false,
      secretLeakFindings: findings.secretFindings.length,
      legacyFindings: findings.legacyFindings.length,
      hostedFindings: findings.hostedFindings.length,
      fakeClaimFindings: findings.fakeClaimFindings.length
    },
    commandsRun,
    blockers
  };
  const publicMd = [
    "# GitCaster CasterDID identity layer",
    "",
    "Status: public-alpha, local identity inspection only",
    "",
    "This layer publishes local CasterDID helpers for contributor review.",
    "It exposes DID documents, public-key fingerprints, local signed envelopes, and a public-key-only fixture.",
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
    "pnpm run casterdid-identity:check",
    "pnpm run casterdid-identity:public-smoke",
    "```",
    ""
  ].join("\n");
  writeJson(publicJsonPath, publicJson);
  fs.mkdirSync(path.dirname(publicMdPath), { recursive: true });
  fs.writeFileSync(publicMdPath, publicMd);
  if (!fs.existsSync(publicSmokeEvidencePath) || !fs.existsSync(publicSmokeJsonPath)) {
    const pendingSmoke = {
      type: "gitcaster.casterdid-identity.public-smoke.v1",
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
    type: "gitcaster.casterdid-identity.evidence.v1",
    title: "CasterDID identity public-alpha layer",
    createdAt: new Date().toISOString(),
    status: blockers.length === 0 ? "passed" : "failed",
    repoRoot,
    filesChanged: requiredFiles.concat([
      "apps/web/public/gitcaster-casterdid-identity.json",
      "apps/web/public/gitcaster-casterdid-identity.md",
      "launch/evidence/casterdid-identity-public-alpha.json"
    ]),
    commandsRun,
    blockers,
    findings,
    summary: publicJson.summary,
    publicJson: path.relative(repoRoot, publicJsonPath).replaceAll("\\", "/"),
    publicMarkdown: path.relative(repoRoot, publicMdPath).replaceAll("\\", "/"),
    nextProof: "Published package artifact, managed custody review, public runtime endpoint, node mutation, storage, domain, rollback, and release-candidate proof"
  };
  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({ status: evidence.status, evidence: "launch/evidence/casterdid-identity-public-alpha.json", publicJson: "apps/web/public/gitcaster-casterdid-identity.json", blockers }, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  const blocker = error instanceof Error ? error.message : String(error);
  writeJson(evidencePath, { type: "gitcaster.casterdid-identity.evidence.v1", title: "CasterDID identity public-alpha layer", createdAt: new Date().toISOString(), status: "failed", blockers: [blocker] });
  console.error(JSON.stringify({ status: "failed", blocker }, null, 2));
  process.exitCode = 1;
});
