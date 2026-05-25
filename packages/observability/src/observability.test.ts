import assert from "node:assert/strict";
import test from "node:test";
import { createOpsEvent, createOpsEventLog, opsEventLogRootHash, assertNoSensitiveOpsValue } from "./event-log.js";
import { createHealthMonitorPlan, defaultHealthProbes, isLiveHealthStatusAllowed } from "./health-monitor.js";
import { createIncidentResponsePlan, createIncidentRunbook } from "./incident.js";
import { createRollbackPlan, rollbackPlanRootHash } from "./rollback.js";

test("event log root hash is deterministic", () => {
  const event = createOpsEvent({ kind: "security", severity: "warning", status: "passed", title: "check", summary: "redacted", source: "launch/evidence/pr-27-security-redteam-crypto-audit.json", evidence: [] });
  const log = createOpsEventLog([event], "2026-05-22T00:00:00.000Z");
  assert.equal(log.rootHash, opsEventLogRootHash(log));
});

test("redaction removes bearer/API/private-key-looking values", () => {
  assert.throws(() => assertNoSensitiveOpsValue("Authorization: Bearer abcdefghijklmnop"), /sensitive/);
});

test("event log does not allow CasterAgents runtime values", () => {
  assert.throws(() => assertNoSensitiveOpsValue("balances.json"), /runtime/);
});

test("health monitor covers QStorage", () => assert.ok(defaultHealthProbes().some((probe) => probe.surface === "qstorage")));
test("health monitor covers CasterCloud", () => assert.ok(defaultHealthProbes().some((probe) => probe.surface === "castercloud")));
test("health monitor covers public node surfaces", () => assert.equal(defaultHealthProbes().filter((probe) => probe.surface.startsWith("public-node")).length, 3));
test("health monitor does not allow live monitoring without proof", () => assert.equal(isLiveHealthStatusAllowed("monitored", []), false));
test("health monitor does not mark QStorage verified without PR-23 proof", () => {
  const probe = defaultHealthProbes().find((item) => item.surface === "qstorage");
  assert.equal(probe?.status, "requires-verification-proof");
});
test("health monitor does not mark public nodes online without PR-24 proof", () => {
  const probe = defaultHealthProbes().find((item) => item.surface === "public-node-1");
  assert.equal(probe?.status, "requires-health-proof");
});

test("incident plan includes secret leak scenario", () => assert.ok(createIncidentResponsePlan({}).runbooks.some((runbook) => runbook.scenario === "secret-leak")));
test("incident plan includes CasterAgents state leak scenario", () => assert.ok(createIncidentResponsePlan({}).runbooks.some((runbook) => runbook.scenario === "casteragents-state-leak")));
test("incident plan includes Caster Punks bundle bloat scenario", () => assert.ok(createIncidentResponsePlan({}).runbooks.some((runbook) => runbook.scenario === "caster-punks-bundle-bloat")));
test("incident runbook redaction removes secrets", () => {
  const runbook = createIncidentRunbook({
    scenario: "secret-leak",
    severity: "sev1-critical",
    status: "manual-required",
    owner: "security",
    detection: ["Authorization: Bearer abcdefghijklmnop"],
    containment: [],
    rollback: [],
    communication: [],
    evidenceToCollect: [],
    postIncident: []
  });
  assert.equal(runbook.detection[0].includes("abcdefghijklmnop"), false);
});

test("rollback plan covers web static export", () => assert.ok(createRollbackPlan({}).surfaces.includes("web-static-export")));
test("rollback plan covers deployment manifest", () => assert.ok(createRollbackPlan({}).surfaces.includes("deployment-manifest")));
test("rollback plan covers ecosystem directory", () => assert.ok(createRollbackPlan({}).surfaces.includes("ecosystem-directory")));
test("rollback dry run does not set rollbackExecuted true", () => assert.equal(createRollbackPlan({}).rollbackExecuted, false));
test("rollback plan root hash is deterministic", () => {
  const plan = createRollbackPlan({ createdAt: "2026-05-22T00:00:00.000Z" });
  assert.equal(plan.rootHash, rollbackPlanRootHash(plan));
});

test("generated ops JSON does not contain reference-only public identity", () => {
  const json = JSON.stringify(createHealthMonitorPlan({ probes: defaultHealthProbes(), createdAt: "2026-05-22T00:00:00.000Z" }));
  assert.equal(new RegExp("git" + "lawb", "i").test(json), false);
});

test("generated ops JSON does not contain hosted-platform production path", () => {
  const json = JSON.stringify(createHealthMonitorPlan({ probes: defaultHealthProbes(), createdAt: "2026-05-22T00:00:00.000Z" }));
  assert.equal(/vercel.*production|production.*vercel/i.test(json), false);
});

test("generated ops JSON does not set canShipProduction true", () => {
  assert.equal(createHealthMonitorPlan({ probes: defaultHealthProbes() }).canShipProduction, false);
});
