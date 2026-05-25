import { createHash } from "node:crypto";
import type { GitCasterEvent, GitCasterIssue, GitCasterObjectManifest, GitCasterPR, GitCasterRef, GitCasterRepo, RefUpdateCertificate } from "../../../../packages/protocol/dist/types.js";
import type { GitCasterPRReview } from "../../../../packages/repo-records/dist/index.js";
import { createEmptyRefLedger, appendRefCertificate, type DoubleSignEvidence, type RefConflictEvidence, type RefLedger } from "../../../../packages/ref-consensus/dist/index.js";
import { generateEd25519KeyPair } from "../../../../packages/identity/dist/index.js";
import { listRepoEvents as filterRepoEvents } from "../../../../packages/repo-records/dist/index.js";
import { MemoryNonceStore } from "../../../../packages/security/dist/index.js";
import type { GitCasterNodeConfig } from "../config.js";

export interface IdentityRecord {
  did: string;
  publicKeyPem: string;
  displayName?: string;
  kind: "human" | "agent" | "node";
  registeredAt: string;
}

export interface LocalAlphaStore {
  identities: Map<string, IdentityRecord>;
  repos: Map<string, GitCasterRepo>;
  reposById: Map<string, GitCasterRepo>;
  reposByOwner: Map<string, Set<string>>;
  repoEventsByRepoId: Map<string, GitCasterEvent[]>;
  repoRefsByRepoId: Map<string, GitCasterRef[]>;
  refLedgersByRepoRef: Map<string, RefLedger>;
  conflictEvidence: RefConflictEvidence[];
  doubleSignEvidence: DoubleSignEvidence[];
  objectManifestsByRepoId: Map<string, GitCasterObjectManifest[]>;
  latestObjectManifestByRepoId: Map<string, GitCasterObjectManifest>;
  repoTreesByRepoId: Map<string, unknown[]>;
  latestPushByRepoId: Map<string, unknown>;
  issuesByRepoId: Map<string, GitCasterIssue[]>;
  prsByRepoId: Map<string, GitCasterPR[]>;
  reviewsByPrId: Map<string, GitCasterPRReview[]>;
  issueCounterByRepoId: Map<string, number>;
  prCounterByRepoId: Map<string, number>;
  reviewCounterByPrId: Map<string, number>;
  issues: Map<string, GitCasterIssue[]>;
  prs: Map<string, GitCasterPR[]>;
  events: GitCasterEvent[];
  nonces: MemoryNonceStore;
  nodeKeys: { publicKeyPem: string; privateKeyPem: string };
  startedAt: string;
  writesAccepted: number;
}

export function createLocalAlphaStore(config: GitCasterNodeConfig): LocalAlphaStore {
  return {
    identities: new Map(),
    repos: new Map(),
    reposById: new Map(),
    reposByOwner: new Map(),
    repoEventsByRepoId: new Map(),
    repoRefsByRepoId: new Map(),
    refLedgersByRepoRef: new Map(),
    conflictEvidence: [],
    doubleSignEvidence: [],
    objectManifestsByRepoId: new Map(),
    latestObjectManifestByRepoId: new Map(),
    repoTreesByRepoId: new Map(),
    latestPushByRepoId: new Map(),
    issuesByRepoId: new Map(),
    prsByRepoId: new Map(),
    reviewsByPrId: new Map(),
    issueCounterByRepoId: new Map(),
    prCounterByRepoId: new Map(),
    reviewCounterByPrId: new Map(),
    issues: new Map(),
    prs: new Map(),
    events: [],
    nonces: new MemoryNonceStore(),
    nodeKeys: generateEd25519KeyPair(),
    startedAt: config.startedAt,
    writesAccepted: 0,
  };
}

export function readStoreSummary(store: LocalAlphaStore) {
  return {
    repos: store.repos.size,
    refs: [...store.repoRefsByRepoId.values()].reduce((sum, refs) => sum + refs.length, 0),
    issues: [...store.issuesByRepoId.values()].reduce((sum, items) => sum + items.length, 0),
    prs: [...store.prsByRepoId.values()].reduce((sum, items) => sum + items.length, 0),
    reviews: [...store.reviewsByPrId.values()].reduce((sum, items) => sum + items.length, 0),
    agents: [...store.identities.values()].filter((item) => item.kind === "agent").length,
    events: store.events.length,
    writesAccepted: store.writesAccepted,
  };
}

export function appendEvent(store: LocalAlphaStore, event: GitCasterEvent): void {
  store.events.push(event);
}

export function appendRepoEventToStore(store: LocalAlphaStore, repoId: string, event: GitCasterEvent): void {
  store.repoEventsByRepoId.set(repoId, filterRepoEvents([...(store.repoEventsByRepoId.get(repoId) || []), event], repoId));
  appendEvent(store, event);
}

export function registerIdentity(store: LocalAlphaStore, identityRecord: IdentityRecord): void {
  store.identities.set(identityRecord.did, identityRecord);
  store.writesAccepted += 1;
  appendEvent(store, {
    type: identityRecord.kind === "agent" ? "gitcaster.agent.joined.v1" : "gitcaster.node.announced.v1",
    id: `event-${createHash("sha256").update(identityRecord.did).digest("hex").slice(0, 12)}`,
    actor: identityRecord.did,
    payload: { kind: identityRecord.kind, displayName: identityRecord.displayName || null },
    timestamp: identityRecord.registeredAt,
    signature: null,
    status: "alpha-local",
  });
}

function ownerRepoKey(ownerDid: string, repoName: string): string {
  return `${ownerDid}/${repoName}`;
}

export function createRepoInStore(store: LocalAlphaStore, repo: GitCasterRepo, createdEvent: GitCasterEvent): void {
  const key = ownerRepoKey(repo.owner, repo.name);
  store.repos.set(key, repo);
  store.reposById.set(repo.id, repo);
  const ownerSet = store.reposByOwner.get(repo.owner) || new Set<string>();
  ownerSet.add(repo.name);
  store.reposByOwner.set(repo.owner, ownerSet);
  store.repoRefsByRepoId.set(repo.id, repo.refs.map((ref) => ({ ...ref })));
  store.repoEventsByRepoId.set(repo.id, filterRepoEvents([...(store.repoEventsByRepoId.get(repo.id) || []), createdEvent], repo.id));
  appendEvent(store, createdEvent);
  store.writesAccepted += 1;
}

export function repoExistsForOwner(store: LocalAlphaStore, ownerDid: string, repoName: string): boolean {
  return Boolean(store.repos.get(ownerRepoKey(ownerDid, repoName)));
}

export function getRepoByOwnerAndName(store: LocalAlphaStore, ownerDid: string, repoName: string): GitCasterRepo | null {
  return store.repos.get(ownerRepoKey(ownerDid, repoName)) || null;
}

export function getRepoById(store: LocalAlphaStore, repoId: string): GitCasterRepo | null {
  return store.reposById.get(repoId) || null;
}

export function listRepos(store: LocalAlphaStore): GitCasterRepo[] {
  return [...store.repos.values()];
}

export function listAgents(store: LocalAlphaStore): unknown[] {
  return [...store.identities.values()].filter((item) => item.kind === "agent").map((item) => ({ did: item.did, displayName: item.displayName, status: "alpha-local" }));
}

export function listEvents(store: LocalAlphaStore): GitCasterEvent[] {
  return [...store.events];
}

export function getRepo(store: LocalAlphaStore, owner: string, repo: string): GitCasterRepo | null {
  return getRepoByOwnerAndName(store, owner, repo);
}

export function listRepoEvents(store: LocalAlphaStore, repoId: string): GitCasterEvent[] {
  return [...(store.repoEventsByRepoId.get(repoId) || [])];
}

export function listRepoRefs(store: LocalAlphaStore, repoId: string): GitCasterRef[] {
  return [...(store.repoRefsByRepoId.get(repoId) || [])];
}

function repoRefKey(repoId: string, ref: string): string {
  return `${repoId}#${ref}`;
}

export function getRefLedger(store: LocalAlphaStore, repoId: string, ref: string): RefLedger {
  return store.refLedgersByRepoRef.get(repoRefKey(repoId, ref)) || createEmptyRefLedger(repoId, ref);
}

export function setRefLedger(store: LocalAlphaStore, repoId: string, ref: string, ledger: RefLedger): void {
  store.refLedgersByRepoRef.set(repoRefKey(repoId, ref), ledger);
}

export function appendRefCertificateToStore(store: LocalAlphaStore, repoId: string, ref: string, cert: RefUpdateCertificate): RefLedger {
  const ledger = appendRefCertificate(getRefLedger(store, repoId, ref), cert);
  setRefLedger(store, repoId, ref, ledger);
  const refs = store.repoRefsByRepoId.get(repoId) || [];
  const nextRefs = refs.some((item) => item.name === ref)
    ? refs.map((item) => (item.name === ref ? { ...item, head: cert.to, certificate: cert, updatedAt: cert.timestamp, status: "alpha-local" as const } : item))
    : [
        ...refs,
        {
          type: "gitcaster.ref.v1" as const,
          repo: repoId,
          name: ref,
          head: cert.to,
          cid: null,
          certificate: cert,
          updatedAt: cert.timestamp,
          status: "alpha-local" as const,
        },
      ];
  store.repoRefsByRepoId.set(repoId, nextRefs);
  return ledger;
}

export function listRefLedgerEntries(store: LocalAlphaStore, repoId: string, ref: string) {
  return getRefLedger(store, repoId, ref).entries;
}

export function recordRefConflictEvidence(store: LocalAlphaStore, evidence: RefConflictEvidence): void {
  store.conflictEvidence.push(evidence);
}

export function recordDoubleSignEvidence(store: LocalAlphaStore, evidence: DoubleSignEvidence): void {
  store.doubleSignEvidence.push(evidence);
}

export function storeObjectManifestForRepo(store: LocalAlphaStore, repoId: string, manifest: GitCasterObjectManifest): void {
  const manifests = store.objectManifestsByRepoId.get(repoId) || [];
  store.objectManifestsByRepoId.set(repoId, [...manifests, manifest]);
  store.latestObjectManifestByRepoId.set(repoId, manifest);
}

export function getLatestObjectManifestForRepo(store: LocalAlphaStore, repoId: string): GitCasterObjectManifest | null {
  return store.latestObjectManifestByRepoId.get(repoId) || null;
}

export function storeRepoTreeForRepo(store: LocalAlphaStore, repoId: string, tree: unknown[]): void {
  store.repoTreesByRepoId.set(repoId, tree);
}

export function getRepoTree(store: LocalAlphaStore, repoId: string): unknown[] {
  return [...(store.repoTreesByRepoId.get(repoId) || [])];
}

export function recordPushResult(store: LocalAlphaStore, repoId: string, result: unknown): void {
  store.latestPushByRepoId.set(repoId, result);
}

export function nextIssueId(store: LocalAlphaStore, repoId: string): string {
  const next = (store.issueCounterByRepoId.get(repoId) || 0) + 1;
  store.issueCounterByRepoId.set(repoId, next);
  return `issue-${next}`;
}

export function nextPRId(store: LocalAlphaStore, repoId: string): string {
  const next = (store.prCounterByRepoId.get(repoId) || 0) + 1;
  store.prCounterByRepoId.set(repoId, next);
  return `pr-${next}`;
}

export function nextReviewId(store: LocalAlphaStore, repoId: string, prId: string): string {
  const key = `${repoId}#${prId}`;
  const next = (store.reviewCounterByPrId.get(key) || 0) + 1;
  store.reviewCounterByPrId.set(key, next);
  return `review-${next}`;
}

export function createIssueInStore(store: LocalAlphaStore, repoId: string, issue: GitCasterIssue, event: GitCasterEvent): void {
  const issues = store.issuesByRepoId.get(repoId) || [];
  store.issuesByRepoId.set(repoId, [...issues, issue]);
  store.issues.set(repoId, [...issues, issue]);
  appendRepoEventToStore(store, repoId, event);
  store.writesAccepted += 1;
}

export function updateIssueInStore(store: LocalAlphaStore, repoId: string, issue: GitCasterIssue, event: GitCasterEvent): void {
  const issues = store.issuesByRepoId.get(repoId) || [];
  const nextIssues = issues.map((item) => (item.id === issue.id ? issue : item));
  store.issuesByRepoId.set(repoId, nextIssues);
  store.issues.set(repoId, nextIssues);
  appendRepoEventToStore(store, repoId, event);
  store.writesAccepted += 1;
}

export function listIssuesForRepo(store: LocalAlphaStore, repoId: string): GitCasterIssue[] {
  return [...(store.issuesByRepoId.get(repoId) || [])];
}

export function getIssueById(store: LocalAlphaStore, repoId: string, issueId: string): GitCasterIssue | null {
  return listIssuesForRepo(store, repoId).find((issue) => issue.id === issueId) || null;
}

export function createPRInStore(store: LocalAlphaStore, repoId: string, pr: GitCasterPR, event: GitCasterEvent): void {
  const prs = store.prsByRepoId.get(repoId) || [];
  store.prsByRepoId.set(repoId, [...prs, pr]);
  store.prs.set(repoId, [...prs, pr]);
  appendRepoEventToStore(store, repoId, event);
  store.writesAccepted += 1;
}

export function updatePRInStore(store: LocalAlphaStore, repoId: string, pr: GitCasterPR, event: GitCasterEvent): void {
  const prs = store.prsByRepoId.get(repoId) || [];
  const nextPrs = prs.map((item) => (item.id === pr.id ? pr : item));
  store.prsByRepoId.set(repoId, nextPrs);
  store.prs.set(repoId, nextPrs);
  appendRepoEventToStore(store, repoId, event);
  store.writesAccepted += 1;
}

export function listPRsForRepo(store: LocalAlphaStore, repoId: string): GitCasterPR[] {
  return [...(store.prsByRepoId.get(repoId) || [])];
}

export function getPRById(store: LocalAlphaStore, repoId: string, prId: string): GitCasterPR | null {
  return listPRsForRepo(store, repoId).find((pr) => pr.id === prId) || null;
}

export function createReviewInStore(store: LocalAlphaStore, repoId: string, prId: string, review: GitCasterPRReview, event: GitCasterEvent): void {
  const key = `${repoId}#${prId}`;
  const reviews = store.reviewsByPrId.get(key) || [];
  store.reviewsByPrId.set(key, [...reviews, review]);
  appendRepoEventToStore(store, repoId, event);
  store.writesAccepted += 1;
}

export function listReviewsForPR(store: LocalAlphaStore, repoId: string, prId: string): GitCasterPRReview[] {
  return [...(store.reviewsByPrId.get(`${repoId}#${prId}`) || [])];
}

export function getRepoProofPlaceholders(store: LocalAlphaStore, repoId: string) {
  const repo = getRepoById(store, repoId);
  const refLedgerEntries = repo ? [...store.refLedgersByRepoRef.values()].filter((ledger) => ledger.repo === repoId).reduce((sum, ledger) => sum + ledger.entries.length, 0) : 0;
  const objectManifest = getLatestObjectManifestForRepo(store, repoId);
  const issueCount = listIssuesForRepo(store, repoId).length;
  const prCount = listPRsForRepo(store, repoId).length;
  const reviewCount = listPRsForRepo(store, repoId).reduce((sum, pr) => sum + listReviewsForPR(store, repoId, pr.id).length, 0);
  return {
    type: "gitcaster.repo.proofs.v1",
    status: "alpha-local",
    repo: repoId,
    proofs: {
      repoManifest: {
        status: repo ? "alpha-local" : "blocked",
        hash: repo ? `sha256:${createHash("sha256").update(JSON.stringify(repo)).digest("hex")}` : null,
      },
      refLedger: {
        status: repo ? "alpha-local" : "blocked",
        entries: refLedgerEntries,
        appendOnly: true,
      },
      objectManifest: objectManifest
        ? {
            status: "alpha-local",
            rootHash: objectManifest.rootHash,
            objectCount: objectManifest.objects.length,
            proof: {
              status: "alpha-local",
              rootHash: objectManifest.rootHash,
            },
          }
        : {
            status: "blocked",
            reason: "No object manifest exists until push-local is completed.",
          },
      qstorage: {
        status: "requires-endpoint",
        verified: false,
        blocker: "QStorage publish is implemented in PR-06 and requires endpoint credentials.",
      },
      castercloud: {
        status: "requires-endpoint",
        verified: false,
        blocker: "CasterCloud deploy is implemented later and requires endpoint credentials.",
      },
      collaborationRecords: {
        status: repo ? "alpha-local" : "blocked",
        issues: issueCount,
        prs: prCount,
        reviews: reviewCount,
        publicNetworkClaimed: false,
      },
    },
  };
}

export function placeholderRepoProofs(owner: string, repo: string) {
  return { owner, repo, status: "blocked", reason: "Repo proofs require repo records." };
}
