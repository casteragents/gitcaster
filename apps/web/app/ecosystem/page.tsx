import { EcosystemDirectory, type EcosystemDirectoryEntry } from "../../components/EcosystemDirectory";
import canonicalManifest from "../../public/gitcaster-ecosystem.canonical.json";
import rcManifest from "../../public/gitcaster-ecosystem.rc.json";
import { sitePath } from "../../lib/site-url";

type EcosystemRcManifest = {
  entries?: EcosystemDirectoryEntry[];
  summary?: Record<string, unknown>;
  notes?: string[];
};

export default function EcosystemPage() {
  const rc = rcManifest as EcosystemRcManifest;
  const canonical = canonicalManifest as EcosystemRcManifest;
  const entries = Array.isArray(rc.entries) && rc.entries.length > 0 ? rc.entries : (canonical.entries ?? []);
  const summary = rc.summary ?? { entriesTotal: entries.length };

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Ecosystem RC directory</div>
        <h1>GitCaster ecosystem</h1>
        <p className="lede">RC directory candidate. Listings are not approval. Proof and blockers render before stronger claims.</p>
        <div className="actions">
          <a className="button primary" href={sitePath("/ecosystem/submit")}>Preview submission policy</a>
          <a className="button" href={sitePath("/status")}>View proof status</a>
        </div>
      </div>
      <EcosystemDirectory entries={entries} summary={summary} showProof showBlockers />
    </div>
  );
}
