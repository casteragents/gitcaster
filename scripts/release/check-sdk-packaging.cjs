#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, "launch", "evidence");
const tsEvidencePath = path.join(evidenceDir, "sdk-typescript-package-check.json");
const pyEvidencePath = path.join(evidenceDir, "sdk-python-package-check.json");
const packagingEvidencePath = path.join(evidenceDir, "sdk-packaging-check.json");

const forbiddenIdentity = [
  "Git" + "lawb",
  "git" + "lawb://",
  "did:" + "gitlawb",
  "GIT" + "LAWB_NODE",
  "GIT" + "LAWB_DID",
  "GIT" + "LAWB_KEY",
  "~/.git" + "lawb",
  "git-remote-git" + "lawb",
  "$" + "GITLAWB",
  "node.git" + "lawb.com",
];

const hostedTerms = ["Vercel", "Supabase", "Fly", "Render", "Netlify", "Pinata", "Filecoin", "Arweave"];
const secretPatterns = [
  /BEGIN (?:OPENSSH )?PRIVATE KEY/,
  /sk-[A-Za-z0-9]{16,}/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/,
  /(?:OPENAI_API_KEY|CASTER_QSTORAGE_WRITE_TOKEN|CASTER_CLOUD_DEPLOY_TOKEN|FARCASTER_TOKEN)=\S+/,
  /\b(?:seed phrase|mnemonic)\b/i,
  /data:image\//,
  /[A-Za-z0-9+/]{500,}={0,2}/,
];

const pr26Files = [
  "packages/sdk-typescript/package.json",
  "packages/sdk-typescript/tsconfig.json",
  "packages/sdk-typescript/src/index.ts",
  "packages/sdk-typescript/src/client.ts",
  "packages/sdk-typescript/src/types.ts",
  "packages/sdk-typescript/src/sdk-typescript.test.ts",
  "packages/sdk-python/pyproject.toml",
  "packages/sdk-python/gitcaster/__init__.py",
  "packages/sdk-python/gitcaster/client.py",
  "packages/sdk-python/gitcaster/types.py",
  "packages/sdk-python/tests/test_client.py",
  "docs/sdk-typescript.md",
  "docs/sdk-python.md",
  "docs/tooling-release-hardening.md",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(rel) {
  return fs.existsSync(path.join(repoRoot, rel)) ? fs.readFileSync(path.join(repoRoot, rel), "utf8") : "";
}

function readJson(rel, fallback = null) {
  try {
    return JSON.parse(read(rel));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function parsePyProject(text) {
  const name = text.match(/^name\s*=\s*"([^"]+)"/m)?.[1] || null;
  const version = text.match(/^version\s*=\s*"([^"]+)"/m)?.[1] || null;
  const depsBlock = text.match(/^dependencies\s*=\s*\[([\s\S]*?)\]/m)?.[1] || "";
  const dependencies = depsBlock.split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean);
  return { name, version, dependencies };
}

function scanFiles(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    if (!text) continue;
    for (const term of forbiddenIdentity) {
      if (text.includes(term)) findings.push({ rule: "forbidden-identity", file, term });
    }
    for (const term of hostedTerms) {
      const hostedProduction = new RegExp(`${term}[^\\n]{0,80}\\b(production|canonical|primary|deployed|live)\\b`, "i");
      if (hostedProduction.test(text) && !/\b(no|not|without|blocked|forbidden|legacy|migration)\b/i.test(text)) {
        findings.push({ rule: "hosted-platform-production", file, term });
      }
    }
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) findings.push({ rule: "secret-like-content", file });
    }
  }
  return findings;
}

function main() {
  const tsPkg = readJson("packages/sdk-typescript/package.json", {});
  const pyText = read("packages/sdk-python/pyproject.toml");
  const pyProject = parsePyProject(pyText);
  const findings = scanFiles(pr26Files);

  const typescript = {
    packageFound: Boolean(tsPkg.name),
    name: tsPkg.name || null,
    private: tsPkg.private === true,
    version: tsPkg.version || null,
    buildScript: Boolean(tsPkg.scripts?.build),
    testScript: Boolean(tsPkg.scripts?.test),
    publishClaimed: Boolean(tsPkg.publishConfig),
  };

  const python = {
    packageFound: Boolean(pyText),
    name: pyProject.name,
    version: pyProject.version,
    externalDependencies: pyProject.dependencies,
    publishClaimed: /twine|publish|upload/i.test(pyText),
  };

  const blockers = [];
  if (typescript.name !== "@gitcaster/sdk") blockers.push("TypeScript SDK package must be @gitcaster/sdk.");
  if (typescript.private !== true) blockers.push("TypeScript SDK package must stay private in PR-26.");
  if (typescript.version !== "0.1.0-alpha") blockers.push("TypeScript SDK version must be 0.1.0-alpha.");
  if (!typescript.buildScript || !typescript.testScript) blockers.push("TypeScript SDK build/test scripts are required.");
  if (typescript.publishClaimed) blockers.push("TypeScript SDK must not include public publish config in PR-26.");
  if (python.name !== "gitcaster") blockers.push("Python SDK package name must be gitcaster.");
  if (python.version !== "0.1.0a0") blockers.push("Python SDK version must be 0.1.0a0.");
  if (python.externalDependencies.length > 0) blockers.push("Python SDK must use no external dependencies in PR-26.");
  if (python.publishClaimed) blockers.push("Python SDK must not claim publication in PR-26.");
  for (const file of pr26Files.slice(0, 11)) {
    if (!fs.existsSync(path.join(repoRoot, file))) blockers.push(`Missing PR-26 SDK file: ${file}`);
  }
  if (findings.length) blockers.push(...findings.map((item) => `${item.file}: ${item.rule}`));

  const status = blockers.length ? "failed" : "passed";
  const base = {
    createdAt: new Date().toISOString(),
    status,
    blockers,
    secretFindings: findings.filter((item) => item.rule === "secret-like-content"),
    forbiddenIdentityViolations: findings.filter((item) => item.rule === "forbidden-identity").length,
    hostedPlatformProductionViolations: findings.filter((item) => item.rule === "hosted-platform-production").length,
  };

  writeJson(tsEvidencePath, {
    type: "gitcaster.sdk.typescript-package-check.v1",
    ...base,
    typescript,
  });
  writeJson(pyEvidencePath, {
    type: "gitcaster.sdk.python-package-check.v1",
    ...base,
    python,
  });
  writeJson(packagingEvidencePath, {
    type: "gitcaster.sdk.packaging-check.v1",
    ...base,
    typescript,
    python,
  });

  console.log(JSON.stringify({
    status,
    typescript,
    python,
    blockers: blockers.length,
    evidence: [
      "launch/evidence/sdk-typescript-package-check.json",
      "launch/evidence/sdk-python-package-check.json",
      "launch/evidence/sdk-packaging-check.json",
    ],
  }, null, 2));
  if (blockers.length) process.exitCode = 1;
}

main();
