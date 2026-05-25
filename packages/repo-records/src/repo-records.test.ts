import test from "node:test";
import assert from "node:assert/strict";
import { appendRepoEvent, assertAppendOnlyEventLog, createRepoCreatedEvent } from "./event-log.js";
import { createGitCasterIssue, createIssueOpenedEvent, createIssueUpdatedEvent, updateGitCasterIssue, validateIssueTitle } from "./issue.js";
import { createGitCasterPR, createPRMergedEvent, createPROpenedEvent, mergeGitCasterPR, validateBranchName } from "./pr.js";
import { applyReviewToPR, createGitCasterPRReview, createPRReviewedEvent } from "./review.js";
import { createGitCasterRepo, parseGitCasterRepoId, repoIdFromOwnerAndName, slugifyRepoName, validateRepoName } from "./repo.js";

const owner = "did:caster:zTestOwner";

test("valid repo name passes", () => {
  assert.equal(validateRepoName("hello-gitcaster").ok, true);
});

test("repo name with spaces fails validation", () => {
  assert.equal(validateRepoName("hello gitcaster").ok, false);
});

test("slugify converts spaces to hyphens", () => {
  assert.equal(slugifyRepoName("Hello GitCaster"), "hello-gitcaster");
});

test("repo name with slash fails", () => {
  assert.equal(validateRepoName("hello/gitcaster").ok, false);
});

test("repo name with dot-dot fails", () => {
  assert.equal(validateRepoName("hello..gitcaster").ok, false);
});

test("reserved repo name fails", () => {
  assert.equal(validateRepoName("admin").ok, false);
});

test("repo id uses gitcaster protocol and caster DID", () => {
  const id = repoIdFromOwnerAndName(owner, "hello-gitcaster");
  assert.equal(id, "gitcaster://did:caster:zTestOwner/hello-gitcaster");
});

test("repo id parser works", () => {
  assert.deepEqual(parseGitCasterRepoId("gitcaster://did:caster:zTestOwner/hello-gitcaster"), { ownerDid: owner, repoName: "hello-gitcaster" });
});

test("repo creation returns alpha-local repo and default main ref", () => {
  const repo = createGitCasterRepo({ ownerDid: owner, payload: { type: "gitcaster.repo.create.payload.v1", name: "hello-gitcaster" }, createdAt: "2026-05-22T00:00:00.000Z" });
  assert.equal(repo.status, "alpha-local");
  assert.equal(repo.refs[0]?.name, "refs/heads/main");
  assert.equal(repo.refs[0]?.head, null);
});

test("RepoCreated event and append-only log", () => {
  const payload = { type: "gitcaster.repo.create.payload.v1", name: "hello-gitcaster", visibility: "public", defaultBranch: "main" } as const;
  const event = createRepoCreatedEvent({ actor: owner, repoId: repoIdFromOwnerAndName(owner, "hello-gitcaster"), payload, timestamp: "2026-05-22T00:00:00.000Z", signature: "fixture-signature" });
  assert.equal(event.type, "gitcaster.repo.created.v1");
  const previous = appendRepoEvent([], event);
  const next = appendRepoEvent(previous, { ...event, id: `${event.id}-2` });
  assertAppendOnlyEventLog(previous, next);
});

test("generated repo and event JSON use only Caster-native names", () => {
  const payload = { type: "gitcaster.repo.create.payload.v1", name: "hello-gitcaster" } as const;
  const repo = createGitCasterRepo({ ownerDid: owner, payload });
  const event = createRepoCreatedEvent({ actor: owner, repoId: repo.id, payload });
  const text = JSON.stringify({ repo, event });
  assert.equal(text.includes("gitcaster://"), true);
  assert.equal(text.includes("did:caster"), true);
  assert.equal(new RegExp(`git${"lawb"}`, "i").test(text), false);
});

test("issue creation and update work", () => {
  const repo = repoIdFromOwnerAndName(owner, "hello-gitcaster");
  const signature = { signer: owner, alg: "ed25519" as const, sig: "fixture-signature", signedAt: "2026-05-22T00:00:00.000Z" };
  const issue = createGitCasterIssue({
    id: "issue-1",
    repo,
    author: owner,
    signature,
    payload: { type: "gitcaster.issue.create.payload.v1", repo, title: "First issue", body: "Test signed issue", labels: ["bug"] },
    createdAt: "2026-05-22T00:00:00.000Z",
  });
  assert.equal(issue.type, "gitcaster.issue.v1");
  assert.equal(issue.signatures.length, 1);
  assert.equal(createIssueOpenedEvent({ actor: owner, issue }).type, "gitcaster.issue.opened.v1");
  const closed = updateGitCasterIssue({
    issue,
    signature,
    payload: { type: "gitcaster.issue.update.payload.v1", repo, issueId: "issue-1", status: "closed", body: "Resolved locally" },
  });
  assert.equal(closed.status, "closed");
  assert.equal(createIssueUpdatedEvent({ actor: owner, issue: closed }).type, "gitcaster.issue.updated.v1");
});

test("issue validation rejects unsafe input", () => {
  const repo = repoIdFromOwnerAndName(owner, "hello-gitcaster");
  assert.equal(validateIssueTitle("").ok, false);
  assert.equal(validateIssueTitle("x".repeat(161)).ok, false);
  assert.throws(() =>
    createGitCasterIssue({
      id: "issue-1",
      repo: "gitcaster://did:key:zBad/hello",
      author: owner,
      payload: { type: "gitcaster.issue.create.payload.v1", repo, title: "Bad" },
    }),
  );
  assert.throws(() =>
    createGitCasterIssue({
      id: "issue-1",
      repo,
      author: "did:key:zBad",
      payload: { type: "gitcaster.issue.create.payload.v1", repo, title: "Bad" },
    }),
  );
});

test("PR creation, review, and record-only merge work", () => {
  const repo = repoIdFromOwnerAndName(owner, "hello-gitcaster");
  const signature = { signer: owner, alg: "ed25519" as const, sig: "fixture-signature", signedAt: "2026-05-22T00:00:00.000Z" };
  const pr = createGitCasterPR({
    id: "pr-1",
    repo,
    author: owner,
    signature,
    payload: { type: "gitcaster.pr.create.payload.v1", repo, head: "feature/demo", base: "main", title: "Demo PR", body: "Signed PR" },
    createdAt: "2026-05-22T00:00:00.000Z",
  });
  assert.equal(pr.type, "gitcaster.pr.v1");
  assert.equal(createPROpenedEvent({ actor: owner, pr }).type, "gitcaster.pr.opened.v1");
  const review = createGitCasterPRReview({
    id: "review-1",
    repo,
    reviewer: owner,
    signature: "fixture-signature",
    payload: { type: "gitcaster.pr.review.payload.v1", repo, prId: "pr-1", status: "approved", body: "LGTM" },
  });
  const reviewed = applyReviewToPR({ pr, review });
  assert.equal(reviewed.status, "reviewed");
  assert.equal(createPRReviewedEvent({ actor: owner, pr: reviewed, review }).type, "gitcaster.pr.reviewed.v1");
  const merged = mergeGitCasterPR({ pr: reviewed, actor: owner, signature, payload: { type: "gitcaster.pr.merge.payload.v1", repo, prId: "pr-1", strategy: "record-only" } });
  assert.equal(merged.status, "merged");
  assert.equal(createPRMergedEvent({ actor: owner, pr: merged, refsChanged: false }).type, "gitcaster.pr.merged.v1");
});

test("PR validation rejects unsafe input", () => {
  const repo = repoIdFromOwnerAndName(owner, "hello-gitcaster");
  assert.equal(validateBranchName("../bad").ok, false);
  assert.throws(() =>
    createGitCasterPR({
      id: "pr-1",
      repo: "gitcaster://did:key:zBad/hello",
      author: owner,
      payload: { type: "gitcaster.pr.create.payload.v1", repo, head: "feature/demo", base: "main", title: "Bad" },
    }),
  );
  assert.throws(() =>
    createGitCasterPR({
      id: "pr-1",
      repo,
      author: "did:key:zBad",
      payload: { type: "gitcaster.pr.create.payload.v1", repo, head: "feature/demo", base: "main", title: "Bad" },
    }),
  );
});

test("issue and PR JSON stays local alpha and Caster-native", () => {
  const repo = repoIdFromOwnerAndName(owner, "hello-gitcaster");
  const issue = createGitCasterIssue({ id: "issue-1", repo, author: owner, payload: { type: "gitcaster.issue.create.payload.v1", repo, title: "First issue" } });
  const pr = createGitCasterPR({ id: "pr-1", repo, author: owner, payload: { type: "gitcaster.pr.create.payload.v1", repo, head: "feature/demo", base: "main", title: "Demo PR" } });
  const text = JSON.stringify({ issue, pr });
  assert.equal(new RegExp(`git${"lawb"}`, "i").test(text), false);
  assert.equal(/\b(live|deployed|verified|production)\b/i.test(text), false);
});
