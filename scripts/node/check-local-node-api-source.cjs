#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "../..");
const packageOnly = process.argv.includes("--package-only");
const runtimeOnly = process.argv.includes("--runtime-only");
const evidencePath = path.join(repoRoot, "launch/evidence/local-node-api-source.json");

const sourceFiles = [
  "apps/node/package.json",
  "apps/node/tsconfig.json",
  "apps/node/src/server.ts",
  "apps/node/src/config.ts",
  "apps/node/src/services/http.ts",
  "apps/node/src/services/json.ts",
  "apps/node/src/services/local-alpha-store.ts",
  "apps/node/src/services/mutation-verify.ts",
  "apps/node/src/services/redact.ts",
  "apps/node/src/services/route-registry.ts",
  "apps/node/src/routes/health.ts",
  "apps/node/src/routes/node.ts",
  "apps/node/src/routes/repos.ts",
  "apps/node/src/routes/refs.ts",
  "apps/node/src/routes/issues.ts",
  "apps/node/src/routes/prs.ts",
  "apps/node/src/routes/events.ts",
  "apps/node/src/routes/qstorage.ts",
  "apps/node/src/routes/castercloud.ts",
  "apps/node/src/routes/ecosystem.ts",
  "apps/node/src/routes/miniapps.ts",
  "apps/node/src/routes/domains.ts",
  "apps/node/src/routes/mcp.ts",
  "apps/node/src/routes/identity.ts",
  "apps/node/src/services/repo-service.ts",
  "apps/node/src/services/push-local-service.ts",
  "apps/node/src/services/issue-service.ts",
  "apps/node/src/services/pr-service.ts",
  "apps/node/src/services/secret-scan-lite.ts"
];

const publicFiles = [
  "apps/web/app/open-source/local-node-api/page.tsx",
  "apps/web/public/gitcaster-local-node-api.md",
  "docs-source/developer-layers/local-node-api.md",
  "examples/node/local-api-smoke.example.json",
  "scripts/node/check-local-node-api-source.cjs"
];

const requiredFiles = [...sourceFiles, ...publicFiles];
const skipContentScan = new Set([
  "scripts/node/check-local-node-api-source.cjs",
  "apps/node/src/services/redact.ts"
]);

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function json(body) {
  return JSON.parse(body);
}

async function get(base, route) {
  const response = await fetch(`${base}${route}`);
  return { statusCode: response.status, body: json(await response.text()) };
}

async function post(base, route, payload) {
  const response = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  return { statusCode: response.status, body: json(await response.text()) };
}

async function runtimeChecks(blockers) {
  const serverModulePath = path.join(repoRoot, "apps/node/dist/server.js");
  if (!fs.existsSync(serverModulePath)) {
    blockers.push("apps/node/dist/server.js missing; run pnpm run node-api:check");
    return null;
  }
  const { startGitCasterNode } = await import(pathToFileURL(serverModulePath).href);
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitcaster-local-node-api-"));
  const started = await startGitCasterNode({ host: "127.0.0.1", port: 0, stateDir });
  try {
    const health = await get(started.url, "/health");
    const status = await get(started.url, "/node/status");
    const registry = await get(started.url, "/node/registry");
    const repos = await get(started.url, "/repos");
    const qstorage = await get(started.url, "/qstorage/status");
    const castercloud = await get(started.url, "/castercloud/status");
    const domains = await get(started.url, "/domains");
    const mutation = await post(started.url, "/repos", { name: "hello-gitcaster" });

    if (health.statusCode !== 200 || health.body.status !== "alpha-local") blockers.push("health route must return alpha-local");
    if (health.body.storage?.verified !== false) blockers.push("health route must not claim verified storage");
    if (health.body.peersKnown !== 0 || health.body.gossipEvents !== 0) blockers.push("health route must not claim public peers or gossip");
    if (status.statusCode !== 200 || status.body.status !== "alpha-local") blockers.push("node status route must return alpha-local");
    if (status.body.node?.peerCount !== 0) blockers.push("node status must not claim public peers");
    if (registry.statusCode !== 200 || registry.body.status !== "alpha-local") blockers.push("node registry route must return alpha-local");
    if (!Array.isArray(registry.body.nodes) || !registry.body.nodes.every((node) => node.status === "blocked" && node.publicUrl === null)) blockers.push("planned registry nodes must remain blocked without public URLs");
    if (repos.statusCode !== 200 || repos.body.status !== "alpha-local") blockers.push("repo list route must return alpha-local");
    if (qstorage.body.verified !== false || !String(qstorage.body.status).includes("requires")) blockers.push("qstorage status must remain endpoint-gated");
    if (castercloud.body.verified !== false || !String(castercloud.body.status).includes("requires")) blockers.push("castercloud status must remain endpoint-gated");
    if (domains.body.status !== "requires-registry") blockers.push("domains index must require registry proof");
    if (mutation.statusCode !== 401 || mutation.body.status !== "blocked") blockers.push("unsigned repo mutation must be blocked");
    if (/BEGIN .*PRIVATE KEY|Authorization: Bearer [A-Za-z0-9._-]{8,}/i.test(JSON.stringify({ health, status, mutation }))) blockers.push("runtime response exposed secret-like content");

    return {
      baseUrl: started.url,
      healthStatus: health.body.status,
      storageVerified: health.body.storage?.verified,
      peersKnown: health.body.peersKnown,
      gossipEvents: health.body.gossipEvents,
      registryNodesBlocked: registry.body.nodes.every((node) => node.status === "blocked" && node.publicUrl === null),
      reposStatus: repos.body.status,
      qstorageStatus: qstorage.body.status,
      castercloudStatus: castercloud.body.status,
      domainStatus: domains.body.status,
      unsignedMutationStatusCode: mutation.statusCode,
      unsignedMutationStatus: mutation.body.status
    };
  } finally {
    await started.close();
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
}

async function main() {
  const blockers = [];
  const findings = {
    missingFiles: [],
    forbiddenReferenceFindings: [],
    hostedPlatformFindings: [],
    secretFindings: [],
    fakeClaimFindings: []
  };

  for (const file of requiredFiles) {
    if (!exists(file)) {
      findings.missingFiles.push(file);
      blockers.push(`missing file: ${file}`);
    }
  }

  for (const file of requiredFiles.filter((item) => exists(item) && !skipContentScan.has(item))) {
    const text = read(file);
    if (/(gitlawb:\/\/|did:gitlawb|GITLAWB_NODE|GITLAWB_DID|GITLAWB_KEY|~\/\.gitlawb|git-remote-gitlawb|\$GITLAWB|node\.gitlawb\.com|\bgl identity\b|\bgl repo\b|\bgl pr\b|\bgl issue\b|\bgl node\b|\bgl mcp\b)/i.test(text)) {
      findings.forbiddenReferenceFindings.push({ file, reason: "legacy public identity string found" });
      blockers.push(`${file}: legacy public identity string found`);
    }
    if (/(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|Filecoin|Arweave|GitHub as canonical source)/i.test(text)) {
      findings.hostedPlatformFindings.push({ file, reason: "hosted platform production dependency mention found" });
      blockers.push(`${file}: hosted platform production dependency mention found`);
    }
    if (/(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|data:image\/|[A-Za-z0-9+/]{500,}={0,2})/.test(text)) {
      findings.secretFindings.push({ file, reason: "secret-like content found" });
      blockers.push(`${file}: secret-like content found`);
    }
    if (/(public node federation ready|public nodes online|QStorage verified|CasterCloud deployed|CasterCloud verified|\.caster mapped|multi-node replicated|production-ready|production node health|managed runtime ready|is live now)/i.test(text)) {
      findings.fakeClaimFindings.push({ file, reason: "fake live or production claim found" });
      blockers.push(`${file}: fake live or production claim found`);
    }
  }

  let runtime = null;
  if (!packageOnly) {
    runtime = await runtimeChecks(blockers);
  }

  const nodePackage = exists("apps/node/package.json") ? JSON.parse(read("apps/node/package.json")) : {};
  if (!String(nodePackage.scripts?.build || "").includes("tsc -p tsconfig.json")) blockers.push("apps/node build must use local tsc");
  if (!String(nodePackage.scripts?.check || "").includes("pnpm run build")) blockers.push("apps/node check script must build source");

  const evidence = {
    type: "gitcaster.public-release.evidence.v1",
    slice: "local-node-api-source",
    status: blockers.length === 0 ? "passed" : "failed",
    createdAt: new Date().toISOString(),
    filesChanged: requiredFiles,
    commandsRun: [
      "pnpm run node-api:check",
      "pnpm run test:web",
      "node scripts/web/check-pr12-web-ui.cjs",
      "pnpm run secret-scan",
      "node scripts/web/build-static-export-copy.cjs"
    ],
    summary: {
      publicAlphaSourceReleased: true,
      nodePackageFound: exists("apps/node/package.json"),
      nodeBuildPassed: exists("apps/node/dist/server.js"),
      runtimeSmokePassed: runtime !== null && blockers.length === 0,
      healthStatus: runtime?.healthStatus || "not-run",
      storageVerifiedClaimed: runtime?.storageVerified === true,
      publicPeersClaimed: Number(runtime?.peersKnown || 0) > 0,
      gossipClaimed: Number(runtime?.gossipEvents || 0) > 0,
      registryNodesBlocked: runtime?.registryNodesBlocked === true,
      qstorageStatus: runtime?.qstorageStatus || "not-run",
      castercloudStatus: runtime?.castercloudStatus || "not-run",
      domainStatus: runtime?.domainStatus || "not-run",
      unsignedMutationBlocked: runtime?.unsignedMutationStatus === "blocked",
      publicNetworkClaimed: false,
      productionNodeHealthClaimed: false,
      managedRuntimeClaimed: false,
      secretLeakFindings: findings.secretFindings.length,
      fakeLiveClaimsFound: findings.fakeClaimFindings.length,
      hostedPlatformProductionViolations: findings.hostedPlatformFindings.length,
      forbiddenIdentityViolations: findings.forbiddenReferenceFindings.length
    },
    runtime,
    releaseQuality: {
      releaseLevel: "public-alpha",
      canShipProduction: false,
      productionBlockers: [
        "Local node API source is public-alpha only.",
        "Public node federation is blocked until signed multi-node health proof exists.",
        "QStorage publication is blocked until endpoint, custody, and rollback proof exists.",
        "CasterCloud deployment is blocked until managed ingress, rollback, and smoke proof exists.",
        "Managed runtime, billing, custody, and production operations remain closed."
      ]
    },
    findings,
    blockers
  };

  if (!runtimeOnly) {
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  }

  console.log(JSON.stringify({ status: blockers.length === 0 ? "passed" : "failed", evidence: path.relative(repoRoot, evidencePath).replaceAll("\\", "/"), blockers, runtime }, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
