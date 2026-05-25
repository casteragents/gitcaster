#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const repoRoot = process.cwd();
const evidencePath = path.join(repoRoot, "launch", "evidence", "pr-02-protocol-fixtures.json");

const filesChanged = [
  "packages/protocol/package.json",
  "packages/protocol/tsconfig.json",
  "packages/protocol/src/index.ts",
  "packages/protocol/src/types.ts",
  "packages/protocol/src/events.ts",
  "packages/protocol/src/status.ts",
  "packages/protocol/src/content-types.ts",
  "packages/protocol/src/error-codes.ts",
  "packages/protocol/src/fixtures.ts",
  "fixtures/protocol/caster-identity.json",
  "fixtures/protocol/signed-mutation.repo-create.json",
  "fixtures/protocol/ref-certificate.main.json",
  "fixtures/protocol/object-manifest.local-alpha.json",
  "fixtures/protocol/node-health.alpha-local.json",
  "scripts/protocol/check-fixtures.cjs",
  "launch/evidence/pr-02-protocol-fixtures.json",
];

const requiredStatuses = [
  "verified",
  "live",
  "alpha-local",
  "public-alpha",
  "preview",
  "proof-only",
  "blocked",
  "requires-endpoint",
  "requires-contract",
  "requires-audit",
  "requires-governance",
  "requires-registry",
  "legacy-reference",
  "error",
];

const requiredEvents = [
  "gitcaster.repo.created.v1",
  "gitcaster.repo.imported.v1",
  "gitcaster.commit.pushed.v1",
  "gitcaster.ref.updated.v1",
  "gitcaster.ref.certificate.issued.v1",
  "gitcaster.issue.opened.v1",
  "gitcaster.issue.updated.v1",
  "gitcaster.pr.opened.v1",
  "gitcaster.pr.reviewed.v1",
  "gitcaster.pr.merged.v1",
  "gitcaster.agent.joined.v1",
  "gitcaster.agent.capability.delegated.v1",
  "gitcaster.app.published.v1",
  "gitcaster.miniapp.imported.v1",
  "gitcaster.domain.requested.v1",
  "gitcaster.domain.mapped.v1",
  "gitcaster.qstorage.published.v1",
  "gitcaster.castercloud.deployed.v1",
  "gitcaster.token.reward.proof.v1",
  "gitcaster.node.announced.v1",
  "gitcaster.node.health.signed.v1",
  "gitcaster.replication.proof.v1",
];

const requiredContentTypes = [
  "application/vnd.gitcaster.repo+json",
  "application/vnd.gitcaster.ref-cert+json",
  "application/vnd.gitcaster.signed-mutation+json",
  "application/vnd.gitcaster.object-manifest+json",
  "application/vnd.gitcaster.node-health+json",
  "application/vnd.gitcaster.event+json",
  "application/vnd.gitcaster.capability+json",
  "application/vnd.gitcaster.deployment-proof+json",
  "application/vnd.gitcaster.ecosystem-entry+json",
  "application/vnd.gitcaster.mcp-tool+json",
  "application/vnd.gitcaster.domain-request+json",
  "application/vnd.gitcaster.reward-proof+json",
];

const requiredErrorCodes = [
  "gitcaster.error.invalid_did",
  "gitcaster.error.invalid_signature",
  "gitcaster.error.invalid_capability",
  "gitcaster.error.capability_expired",
  "gitcaster.error.capability_scope_denied",
  "gitcaster.error.capability_resource_mismatch",
  "gitcaster.error.nonce_replay",
  "gitcaster.error.timestamp_skew",
  "gitcaster.error.payload_hash_mismatch",
  "gitcaster.error.ref_from_mismatch",
  "gitcaster.error.ref_force_push_disabled",
  "gitcaster.error.ref_delete_disabled",
  "gitcaster.error.object_missing",
  "gitcaster.error.object_hash_mismatch",
  "gitcaster.error.qstorage_endpoint_missing",
  "gitcaster.error.qstorage_verify_failed",
  "gitcaster.error.castercloud_endpoint_missing",
  "gitcaster.error.castercloud_verify_failed",
  "gitcaster.error.domain_registry_missing",
  "gitcaster.error.token_contract_required",
  "gitcaster.error.audit_required",
  "gitcaster.error.secret_risk",
  "gitcaster.error.sensitive_state_redacted",
  "gitcaster.error.preview_data_only",
  "gitcaster.error.external_blocker",
];

const fixtureFiles = [
  "fixtures/protocol/caster-identity.json",
  "fixtures/protocol/signed-mutation.repo-create.json",
  "fixtures/protocol/ref-certificate.main.json",
  "fixtures/protocol/object-manifest.local-alpha.json",
  "fixtures/protocol/node-health.alpha-local.json",
];

function rel(fullPath) {
  return path.relative(repoRoot, fullPath).split(path.sep).join("/");
}

function exists(relative) {
  return fs.existsSync(path.join(repoRoot, relative));
}

function readText(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), "utf8");
}

function readJson(relative) {
  return JSON.parse(readText(relative));
}

function allIncluded(text, values) {
  return values.filter((value) => !text.includes(value));
}

function flatten(value) {
  return JSON.stringify(value);
}

function hasDidCaster(value) {
  return flatten(value).includes("did:caster");
}

function hasGitCasterUrl(value) {
  return flatten(value).includes("gitcaster://");
}

function fixtureOnlySignaturesMarked(value) {
  const text = flatten(value);
  if (!text.includes("signature")) return true;
  if (text.includes('"signature":null') && text.includes("fixtureNotice")) return true;
  return text.includes("fixture-signature-not-cryptographic") ||
    text.includes("fixture-actor-signature-not-cryptographic") ||
    text.includes("fixture-node-signature-not-cryptographic");
}

function forbiddenReferenceFindings(files) {
  const patterns = [
    "gitlawb://",
    "did:gitlawb",
    "GITLAWB_NODE",
    "GITLAWB_DID",
    "GITLAWB_KEY",
    "~/.gitlawb",
    "git-remote-gitlawb",
    "$GITLAWB",
    "node.gitlawb.com",
    "gl identity",
    "gl repo",
    "gl pr",
    "gl issue",
    "gl node",
    "gl mcp",
  ];
  const findings = [];
  for (const file of files) {
    if (file === "scripts/protocol/check-fixtures.cjs") continue;
    if (!exists(file)) continue;
    const text = readText(file);
    for (const pattern of patterns) {
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        findings.push({ path: file, pattern, classification: "violation" });
      }
    }
    if (/\bGitlawb\b/.test(text) && !/reference-only|Do not use Gitlawb|No Gitlawb protocol names/.test(text)) {
      findings.push({ path: file, pattern: "Gitlawb", classification: "violation" });
    }
  }
  return findings;
}

function hostedPlatformFindings(files) {
  const patterns = [
    "Vercel",
    "Supabase",
    "Cloudflare",
    "Fly",
    "Render",
    "Netlify",
    "Pinata",
    "Filecoin",
    "Arweave",
    "GitHub as canonical source",
  ];
  const findings = [];
  for (const file of files) {
    if (file === "scripts/protocol/check-fixtures.cjs") continue;
    if (!exists(file)) continue;
    const text = readText(file);
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        findings.push({ path: file, pattern, classification: "hosted-platform-production-risk" });
      }
    }
  }
  return findings;
}

function secretFindings(files) {
  const findings = [];
  const patterns = [
    /BEGIN PRIVATE KEY/,
    /sk-[A-Za-z0-9_-]{8,}/,
    /Authorization:\s*Bearer\s+/i,
    /CASTER_QSTORAGE_WRITE_TOKEN\s*=/,
    /CASTER_CLOUD_DEPLOY_TOKEN\s*=/,
    /OPENAI_API_KEY\s*=/,
    /FARCASTER_TOKEN\s*=/,
    /seed phrase/i,
    /mnemonic/i,
    /[A-Za-z0-9+/]{500,}={0,2}/,
    /data:image\//,
  ];
  for (const file of files) {
    if (file === "scripts/protocol/check-fixtures.cjs") continue;
    if (!exists(file)) continue;
    const lines = readText(file).split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      for (const pattern of patterns) {
        if (pattern.test(lines[i])) {
          findings.push({ path: file, line: i + 1, kind: "secret-like-value", redacted: true });
        }
      }
    }
  }
  return findings;
}

function fakeLiveClaims(fixtures) {
  const findings = [];
  const forbidden = [
    "QStorage verified",
    "CasterCloud verified",
    ".caster mapped",
    "staking live",
    "rewards paid",
    "governance live",
    "three-node replication verified",
  ];
  for (const fixture of fixtures) {
    const text = flatten(fixture.data);
    for (const phrase of forbidden) {
      if (text.includes(phrase)) findings.push({ path: fixture.path, phrase });
    }
    if (/"status":"live"/.test(text) || /"verified":true/.test(text)) {
      findings.push({ path: fixture.path, phrase: "live-or-verified-status" });
    }
    if (/\blive\b/i.test(text) && !/\bnot (a )?live\b/i.test(text)) {
      findings.push({ path: fixture.path, phrase: "unqualified live wording" });
    }
  }
  return findings;
}

function writeEvidence(evidence) {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}${os.EOL}`);
}

function main() {
  const packageJson = exists("packages/protocol/package.json") ? readJson("packages/protocol/package.json") : {};
  const statusText = exists("packages/protocol/src/status.ts") ? readText("packages/protocol/src/status.ts") : "";
  const eventsText = exists("packages/protocol/src/events.ts") ? readText("packages/protocol/src/events.ts") : "";
  const contentTypesText = exists("packages/protocol/src/content-types.ts") ? readText("packages/protocol/src/content-types.ts") : "";
  const errorCodesText = exists("packages/protocol/src/error-codes.ts") ? readText("packages/protocol/src/error-codes.ts") : "";
  const fixtures = fixtureFiles.filter(exists).map((file) => ({ path: file, data: readJson(file) }));
  const pr02Files = filesChanged.slice(0, -1);

  const blockers = [];
  for (const file of pr02Files) {
    if (!exists(file)) blockers.push(`missing required file: ${file}`);
  }
  if (packageJson.name !== "@gitcaster/protocol") blockers.push("protocol package name must be @gitcaster/protocol");
  if (packageJson.version !== "0.1.0-alpha") blockers.push("protocol package version must be 0.1.0-alpha");
  for (const missing of allIncluded(statusText, requiredStatuses)) blockers.push(`missing status: ${missing}`);
  for (const missing of allIncluded(eventsText, requiredEvents)) blockers.push(`missing event: ${missing}`);
  for (const missing of allIncluded(contentTypesText, requiredContentTypes)) blockers.push(`missing content type: ${missing}`);
  for (const missing of allIncluded(errorCodesText, requiredErrorCodes)) blockers.push(`missing error code: ${missing}`);
  if (fixtures.length !== fixtureFiles.length) blockers.push("not all required protocol fixtures are present");
  for (const fixture of fixtures) {
    if (!hasDidCaster(fixture.data)) blockers.push(`${fixture.path} missing did:caster`);
    if (fixture.path !== "fixtures/protocol/caster-identity.json" && !hasGitCasterUrl(fixture.data)) blockers.push(`${fixture.path} missing gitcaster://`);
    if (!fixtureOnlySignaturesMarked(fixture.data)) blockers.push(`${fixture.path} has unmarked fixture signature`);
  }

  const forbidden = forbiddenReferenceFindings(pr02Files);
  const hosted = hostedPlatformFindings(pr02Files);
  const secrets = secretFindings(pr02Files);
  const fakeLive = fakeLiveClaims(fixtures);

  if (forbidden.length) blockers.push("forbidden Gitlawb public identity found");
  if (hosted.length) blockers.push("hosted-platform production dependency found");
  if (secrets.length) blockers.push("secret-like value found");
  if (fakeLive.length) blockers.push("fake live claim found");

  const evidence = {
    type: "gitcaster.pr.evidence.v1",
    pr: "PR-02",
    title: "Protocol types and fixtures",
    createdAt: new Date().toISOString(),
    repoRoot,
    filesChanged,
    commandsRun: [
      {
        command: "node scripts/protocol/check-fixtures.cjs",
        checkedAt: new Date().toISOString(),
        status: blockers.length ? "failed" : "passed",
      },
    ],
    passed: blockers.length === 0,
    failed: blockers.length > 0,
    blockers,
    summary: {
      protocolPackageFound: exists("packages/protocol/package.json"),
      typeFilesFound: filesChanged.filter((file) => file.startsWith("packages/protocol/src/") && exists(file)),
      fixturesFound: fixtureFiles.filter(exists),
      fixturesParsed: fixtures.length,
      statusesFound: requiredStatuses.filter((value) => statusText.includes(value)),
      eventsFound: requiredEvents.filter((value) => eventsText.includes(value)),
      contentTypesFound: requiredContentTypes.filter((value) => contentTypesText.includes(value)),
      errorCodesFound: requiredErrorCodes.filter((value) => errorCodesText.includes(value)),
      gitcasterProtocolNamesValid: forbidden.length === 0,
      fixtureOnlySignaturesMarked: fixtures.every((fixture) => fixtureOnlySignaturesMarked(fixture.data)),
      fakeLiveClaimsFound: fakeLive.length,
      forbiddenIdentityViolations: forbidden.length,
      hostedPlatformProductionViolations: hosted.length,
      secretLeakFindings: secrets.length,
      pr01EvidenceFound: exists("launch/evidence/pr-01-monorepo-boundary.json"),
    },
    protocol: {
      version: "0.1.0-alpha",
      packageName: "@gitcaster/protocol",
      identityMethod: "did:caster",
      protocolUrl: "gitcaster://",
      contentTypes: requiredContentTypes,
      statuses: requiredStatuses,
      events: requiredEvents,
      errorCodes: requiredErrorCodes,
    },
    fixtures: fixtures.map((fixture) => ({
      path: fixture.path,
      type: fixture.data.type,
      status: fixture.data.status || fixture.data.identity?.status || null,
      fixtureOnly: flatten(fixture.data).includes("fixture"),
    })),
    forbiddenReferenceFindings: forbidden,
    hostedPlatformFindings: hosted,
    secretFindings: secrets,
    publicClaimsAdded: [],
    publicClaimsRemoved: [],
    noFakeProgressChecks: {
      gitlawbPublicBranding: forbidden.length > 0,
      hostedPlatformProductionDependency: hosted.length > 0,
      fakeLiveClaim: fakeLive.length > 0,
      secretExposed: secrets.length > 0,
      sensitiveAgentStatePublic: false,
    },
    nextPrHandoff: {
      nextPr: "PR-03",
      title: "CasterDID identity and signed envelopes",
      requiredInputs: [
        "packages/protocol/src/types.ts",
        "packages/protocol/src/events.ts",
        "fixtures/protocol/caster-identity.json",
        "fixtures/protocol/signed-mutation.repo-create.json",
        "launch/evidence/pr-02-protocol-fixtures.json",
      ],
      knownRisks: [
        "PR-02 fixtures use fixture-only signatures. PR-03 must implement real signing and verification.",
        "PR-02 does not enforce capabilities. PR-03/PR-04 must enforce signed mutation envelopes.",
      ],
      recommendedCommands: [
        "pnpm --filter @gitcaster/identity test",
        "node scripts/identity/create-alpha-identity.cjs",
        "node scripts/identity/sign-verify-smoke.cjs",
      ],
    },
  };

  writeEvidence(evidence);
  console.log(`PR-02 protocol fixture check ${evidence.passed ? "passed" : "failed"}: ${rel(evidencePath)}`);
  if (blockers.length) {
    for (const blocker of blockers) console.error(`- ${blocker}`);
    process.exit(1);
  }
}

main();
