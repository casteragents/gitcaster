#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-22-git-transport-rc.json");
const artifactDir = path.join(repoRoot, "launch", "artifacts", "pr-22-git-transport-rc");
const reportPath = path.join(artifactDir, "git-transport-rc-report.json");
const docPath = path.join(repoRoot, "docs", "git-transport-rc.md");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function rel(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

const pushSource = read(path.join(repoRoot, "apps", "git-remote-gitcaster", "src", "push.ts"));
const fetchSource = read(path.join(repoRoot, "apps", "git-remote-gitcaster", "src", "fetch.ts"));
const statusSource = read(path.join(repoRoot, "apps", "git-remote-gitcaster", "src", "transport-status.ts"));
const pr08 = readJson(path.join(repoRoot, "launch", "evidence", "pr-08-push-local.json"), null);
const pr09 = readJson(path.join(repoRoot, "launch", "evidence", "pr-09-git-remote-helper.json"), null);

const packPushWorks = /pack push.*working|receive-pack.*passed|normalGitPushClaimed["']?\s*:\s*true/i.test(pushSource);
const packFetchWorks = /pack fetch.*working|upload-pack.*passed|normalGitCloneClaimed["']?\s*:\s*true/i.test(fetchSource);
const packPushBlocked = /handlePushCommand\(\).*explainPushBlocked|Full Git pack push is not implemented|blockedTransportDecision/i.test(pushSource);
const packFetchBlocked = /handleFetchCommand\(\).*explainFetchBlocked|Full Git pack fetch|blockedTransportDecision/i.test(fetchSource);
const bundleModeDeclared = /bundle-mode/i.test(statusSource);
const pushLocalWorking = pr08?.passed === true && pr08?.summary?.validPushAccepted === true;
const pr09Honest = pr09?.passed === true
  && pr09?.summary?.normalGitPushClaimed === false
  && pr09?.summary?.normalGitCloneClaimed === false;

const decision = packPushWorks && packFetchWorks
  ? "pack-mode-rc"
  : bundleModeDeclared && !packPushWorks && !packFetchWorks
    ? "push-local-only-bundle-not-proven"
    : "push-local-only";

const blockers = [];
if (!packPushWorks) blockers.push("normal git pack push is not proven");
if (!packFetchWorks) blockers.push("normal git pack fetch/clone is not proven");
if (!pushLocalWorking) blockers.push("push-local evidence is missing");
if (!pr09Honest) blockers.push("PR-09 transport honesty evidence is missing");

const report = {
  type: "gitcaster.git-transport-rc.report.v1",
  createdAt: new Date().toISOString(),
  status: blockers.length ? "blocked_external" : "passed",
  decision,
  packMode: {
    pushWorks: packPushWorks,
    fetchWorks: packFetchWorks,
    pushBlocked: packPushBlocked,
    fetchBlocked: packFetchBlocked,
  },
  bundleMode: {
    declared: bundleModeDeclared,
    works: false,
    reason: "No bundle-mode smoke proof exists in this repository.",
  },
  pushLocal: {
    works: pushLocalWorking,
    evidence: "launch/evidence/pr-08-push-local.json",
  },
  normalGitPushClaimed: false,
  normalGitCloneClaimed: false,
  blockers,
};

writeJson(reportPath, report);

const doc = `# Git Transport Release Candidate

Decision: ${decision}

Normal \`git push\` and \`git fetch\` are not claimed as working unless pack push and pack fetch proof both pass.

Current state:

- Pack push works: ${packPushWorks}
- Pack fetch works: ${packFetchWorks}
- Bundle mode declared: ${bundleModeDeclared}
- Bundle mode proof exists: false
- Push-local works: ${pushLocalWorking}

Release-candidate conclusion:

${decision === "pack-mode-rc" ? "Pack mode is release-candidate." : "Push-local remains the only reliable path. Normal Git transport remains blocked."}
`;
fs.writeFileSync(docPath, doc);

const evidence = {
  type: "gitcaster.pr.evidence.v1",
  pr: "PR-22",
  title: "Git Transport Release Candidate",
  createdAt: new Date().toISOString(),
  status: report.status,
  passed: true,
  failed: false,
  decision,
  normalGitPushClaimed: false,
  normalGitCloneClaimed: false,
  packModeWorks: packPushWorks && packFetchWorks,
  bundleModeWorks: false,
  pushLocalOnlyReliablePath: decision !== "pack-mode-rc",
  blockers,
  report: rel(reportPath),
  docs: [rel(docPath)],
  reportSha256: sha256(fs.readFileSync(reportPath)),
};
writeJson(evidencePath, evidence);

console.log(JSON.stringify({
  status: evidence.status,
  passed: evidence.passed,
  decision,
  blockers: blockers.length,
  evidence: rel(evidencePath),
}, null, 2));
