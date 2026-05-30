import {
  buildIssueCreatePayload,
  buildIssueUpdatePayload,
  buildMcpServeCommand,
  buildDeployPlanEvidence,
  buildPRCreatePayload,
  buildPRMergePayload,
  buildPRReviewPayload,
  buildPushLocalPayload,
  gitCasterCliHelp,
  parseDeployPlanArgs,
  printPushLocalResult,
} from "./index.js";
import { createLocalDeployManifest } from "@gitcaster/deploy-manifests";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const repo = "gitcaster://did:caster:z6MkwExample/demo";

const push = buildPushLocalPayload({ repo, rootPath: "examples/app", message: "public alpha" });
assertEqual(push.type, "gitcaster.repo.push-local.payload.v1", "push payload type should be stable");
assertEqual(push.branch, "main", "push payload should default branch");
assertEqual(push.message, "public alpha", "push payload should keep local message");

let rejectedLegacyRepo = false;
try {
  buildPushLocalPayload({ repo: "https://example.invalid/repo", rootPath: "." });
} catch {
  rejectedLegacyRepo = true;
}
assert(rejectedLegacyRepo, "push payload should reject non GitCaster repos");

const printed = printPushLocalResult({
  status: "alpha-local",
  repo,
  branch: "main",
  head: "abc123",
  objectManifest: { rootHash: "root", objectCount: 2 },
  refCertificate: { type: "gitcaster.ref.update.v1", status: "alpha-local" },
});
assert(printed.includes("status: alpha-local"), "push printer should expose alpha-local status");

const issue = buildIssueCreatePayload({ repo, title: "Safe issue", labels: ["docs"] });
assertEqual(issue.type, "gitcaster.issue.create.payload.v1", "issue create type should be stable");
assertEqual(issue.labels.length, 1, "issue labels should be preserved");
const issueUpdate = buildIssueUpdatePayload({ repo, issueId: "1", status: "closed" });
assertEqual(issueUpdate.status, "closed", "issue update status should be preserved");

const pr = buildPRCreatePayload({ repo, head: "feature/demo", base: "main", title: "Demo PR" });
assertEqual(pr.type, "gitcaster.pr.create.payload.v1", "PR create type should be stable");
assertEqual(buildPRReviewPayload({ repo, prId: "1", status: "approved" }).status, "approved", "PR review status should be preserved");
assertEqual(buildPRMergePayload({ repo, prId: "1" }).strategy, "record-only", "PR merge should default record-only");

const mcp = buildMcpServeCommand();
assertEqual(mcp.command, "gc", "MCP serve command should use gc");
assertEqual(mcp.args.join(" "), "mcp serve", "MCP serve args should be stable");

const deployArgs = parseDeployPlanArgs(["--manifest", "examples/deploy/local-deploy-manifest.example.json", "--out", "launch/evidence/cli-deploy-plan-local-dry-run.json"]);
assertEqual(deployArgs.manifestPath, "examples/deploy/local-deploy-manifest.example.json", "deploy plan should read manifest path");
const deployPlan = buildDeployPlanEvidence({
  manifest: createLocalDeployManifest({
    id: "cli-deploy-plan-fixture",
    appId: "gitcaster-studio",
    name: "GitCaster Studio",
    layer: "app",
    sourcePath: "apps/web"
  }),
  evidencePath: "launch/evidence/cli-deploy-plan-local-dry-run.json"
});
assertEqual(deployPlan.type, "gitcaster.deploy-plan.local-dry-run.v1", "deploy plan evidence type should be stable");
assertEqual(deployPlan.status, "public-alpha", "deploy plan should remain public-alpha");
assertEqual(deployPlan.claims.productionReady, false, "deploy plan should not claim production readiness");
assert(deployPlan.blockedCapabilities.some((capability) => capability.id === "managed-runtime"), "deploy plan should block managed runtime");
assert(deployPlan.retiredRuntimeDependencies.every((dependency) => dependency.requiredRuntime === false), "deploy plan should not require retired runtime dependencies");

const help = gitCasterCliHelp();
assert(help.includes("gc repo push-local"), "help should include push-local");
assert(help.includes("gc issue create"), "help should include issue create");
assert(help.includes("gc pr create"), "help should include PR create");
assert(help.includes("gc mcp serve"), "help should include MCP serve");
assert(help.includes("gc deploy plan"), "help should include deploy plan");
assert(!/production-ready|deployed|verified|global install/i.test(help), "help should not claim production or installer status");
assert(!/(api[_-]?key|secret|token|private[_-]?key)\s*[:=]/i.test(help), "help should not include secret literals");

console.log(JSON.stringify({ status: "passed", package: "@gitcaster/cli", commands: ["repo push-local", "issue", "pr", "mcp", "deploy plan"] }));
