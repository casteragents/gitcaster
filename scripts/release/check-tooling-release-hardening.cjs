#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch", "evidence", "tooling-release-hardening-check.json");
const files = [
  "packages/sdk-typescript/package.json",
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

const secretPatterns = [
  { name: "private-key", pattern: /BEGIN (?:OPENSSH )?PRIVATE KEY/ },
  { name: "api-key", pattern: /sk-[A-Za-z0-9]{16,}/ },
  { name: "bearer", pattern: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/ },
  { name: "env-secret-value", pattern: /(?:OPENAI_API_KEY|CASTER_QSTORAGE_WRITE_TOKEN|CASTER_CLOUD_DEPLOY_TOKEN|FARCASTER_TOKEN)=\S+/ },
  { name: "seed", pattern: /\b(?:seed phrase|mnemonic)\b/i },
  { name: "inline-image", pattern: /data:image\// },
  { name: "long-base64", pattern: /[A-Za-z0-9+/]{500,}={0,2}/ },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(rel) {
  return fs.existsSync(path.join(repoRoot, rel)) ? fs.readFileSync(path.join(repoRoot, rel), "utf8") : "";
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function scan() {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    if (!text) {
      findings.push({ rule: "missing-file", file });
      continue;
    }
    for (const term of forbiddenIdentity) {
      if (text.includes(term)) findings.push({ rule: "forbidden-identity", file, term });
    }
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const isNegativeOrTest = /\b(no|not|without|blocked|forbidden|requires|must not|does not|do not)\b|assert\.not\w*|assertNotIn/i.test(line);
      if (/\bproduction-ready\b|\bship-production\b|\bGA launch\b/i.test(line) && !isNegativeOrTest) {
        findings.push({ rule: "production-claim", file });
      }
      if (/\b(QStorage verified|CasterCloud deployed|CasterCloud verified|public nodes online|normal git push works|staking live|rewards paid|governance live|\.caster mapped)\b/i.test(line) && !isNegativeOrTest) {
        findings.push({ rule: "fake-proof-claim", file });
      }
    }
    if (/\b(Vercel|Supabase|Cloudflare|Fly|Render|Netlify|Pinata|IPFS|Filecoin|Arweave)\b[^\n]{0,80}\b(production|canonical|primary|deployed|live)\b/i.test(text)
      && !/\b(no|not|without|blocked|forbidden|legacy|migration)\b/i.test(text)) {
      findings.push({ rule: "hosted-platform-production", file });
    }
    const casterAgentsState = /casteragents-projects|casteragents[\\/].*state|runtime-state|CasterAgents runtime state/i.test(text);
    if (casterAgentsState && !/\b(no|not|without|blocked|forbidden|must not)\b[^\n]{0,80}CasterAgents runtime state/i.test(text)) {
      findings.push({ rule: "casteragents-state", file });
    }
    const casterPunksBundle = /caster[- ]?punks[\\/].*\.(png|jpg|jpeg|webp)|Caster Punks image bundles|data:image\//i.test(text);
    if (casterPunksBundle && !/\b(no|not|without|blocked|forbidden|must not)\b[^\n]{0,80}Caster Punks image/i.test(text)) {
      findings.push({ rule: "caster-punks-image-bundle", file });
    }
    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(text)) findings.push({ rule: "secret-like-content", file, name });
    }
  }
  return findings;
}

function main() {
  const findings = scan();
  const status = findings.length ? "failed" : "passed";
  const report = {
    type: "gitcaster.tooling.release-hardening-check.v1",
    status,
    createdAt: new Date().toISOString(),
    filesChecked: files.length,
    sdkTypescriptFound: fs.existsSync(path.join(repoRoot, "packages/sdk-typescript/package.json")),
    sdkPythonFound: fs.existsSync(path.join(repoRoot, "packages/sdk-python/pyproject.toml")),
    productionClaimFound: findings.some((item) => item.rule === "production-claim"),
    fakeProofClaimFound: findings.some((item) => item.rule === "fake-proof-claim"),
    forbiddenIdentityViolations: findings.filter((item) => item.rule === "forbidden-identity").length,
    hostedPlatformProductionViolations: findings.filter((item) => item.rule === "hosted-platform-production").length,
    secretFindings: findings.filter((item) => item.rule === "secret-like-content"),
    casterAgentsStatePublic: findings.some((item) => item.rule === "casteragents-state"),
    casterPunksImagesBundled: findings.some((item) => item.rule === "caster-punks-image-bundle"),
    findings,
  };
  writeJson(evidencePath, report);
  console.log(JSON.stringify({ status, findings: findings.length, evidence: "launch/evidence/tooling-release-hardening-check.json" }, null, 2));
  if (findings.length) process.exitCode = 1;
}

main();
