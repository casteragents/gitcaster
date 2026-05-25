#!/usr/bin/env node
const { runSingle } = require("./run-beta-gate.cjs");
const result = runSingle("token-claim-freeze");
console.log(JSON.stringify({ status: result.status, findingCount: result.findings.length, artifact: result.artifact }, null, 2));
