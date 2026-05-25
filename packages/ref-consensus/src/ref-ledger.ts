import type { RefUpdateCertificate } from "../../protocol/dist/types.js";

export interface RefLedgerEntry {
  type: "gitcaster.ref.ledger.entry.v1";
  height: number;
  repo: string;
  ref: string;
  certificate: RefUpdateCertificate;
  appendedAt: string;
  status: "alpha-local";
}

export interface RefLedger {
  type: "gitcaster.ref.ledger.v1";
  repo: string;
  ref: string;
  entries: RefLedgerEntry[];
  status: "alpha-local";
}

export function createEmptyRefLedger(repo: string, ref: string): RefLedger {
  return { type: "gitcaster.ref.ledger.v1", repo, ref, entries: [], status: "alpha-local" };
}

export function getCurrentHead(ledger: RefLedger, repo: string, ref: string): string | null {
  if (ledger.repo !== repo || ledger.ref !== ref || ledger.entries.length === 0) return null;
  return ledger.entries[ledger.entries.length - 1].certificate.to;
}

export function ledgerHeight(ledger: RefLedger, repo: string, ref: string): number {
  if (ledger.repo !== repo || ledger.ref !== ref) return 0;
  return ledger.entries.length;
}

export function listRefCertificates(ledger: RefLedger, repo: string, ref: string): RefUpdateCertificate[] {
  if (ledger.repo !== repo || ledger.ref !== ref) return [];
  return ledger.entries.map((entry) => entry.certificate);
}

export function appendRefCertificate(ledger: RefLedger, cert: RefUpdateCertificate): RefLedger {
  if (cert.repo !== ledger.repo || cert.ref !== ledger.ref) throw new Error("certificate repo/ref does not match ledger");
  const currentHead = getCurrentHead(ledger, cert.repo, cert.ref);
  if (ledger.entries.length === 0 && cert.from !== null) throw new Error("first update must use from null");
  if (ledger.entries.length > 0 && cert.from !== currentHead) throw new Error("certificate from does not match current head");
  if (!cert.to) throw new Error("branch deletion disabled in PR-07");
  return {
    ...ledger,
    entries: [
      ...ledger.entries,
      {
        type: "gitcaster.ref.ledger.entry.v1",
        height: ledger.entries.length + 1,
        repo: cert.repo,
        ref: cert.ref,
        certificate: cert,
        appendedAt: new Date().toISOString(),
        status: "alpha-local",
      },
    ],
  };
}

export function assertAppendOnlyRefLedger(previous: RefLedger, next: RefLedger): void {
  if (previous.repo !== next.repo || previous.ref !== next.ref) throw new Error("ledger identity changed");
  if (next.entries.length < previous.entries.length) throw new Error("ledger entries were removed");
  for (let index = 0; index < previous.entries.length; index += 1) {
    if (JSON.stringify(previous.entries[index]) !== JSON.stringify(next.entries[index])) throw new Error("previous ledger entry mutated");
  }
}
