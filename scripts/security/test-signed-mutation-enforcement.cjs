#!/usr/bin/env node
const { runSingle } = require("./run-beta-gate.cjs");
const result = runSingle("signed-mutation-enforcement");
console.log(JSON.stringify({ status: result.status, findingCount: result.findings.length, artifact: result.artifact }, null, 2));
