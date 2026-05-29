export type PublicReleaseFeedItem = {
  date: string;
  title: string;
  summary: string;
  website: string;
  repo: string;
  casterchain?: string;
  xPost: string;
  farcaster: string;
};

export const publicReleaseFeed: PublicReleaseFeedItem[] = [
  {
    date: "2026-05-30",
    title: "Ref-consensus local certificates",
    summary:
      "GitCaster now includes public ref-consensus source, signed ref update certificates, append-only local ledgers, conflict evidence, double-sign detection, and unsigned ref mutation blockers for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/ref-consensus/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5290",
    xPost: "https://x.com/casterchain/status/2060498987464225213",
    farcaster: "https://warpcast.com/casterchain/09c7e1a835"
  },
  {
    date: "2026-05-30",
    title: "Push-local object manifests",
    summary:
      "GitCaster now includes public object-store source, local bundle hashes, safety scans, local ref certificate records, blocked QStorage/CasterCloud proofs, and unsigned push-local mutation blockers for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/push-local-object-store/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5289",
    xPost: "https://x.com/casterchain/status/2060482439454363968",
    farcaster: "https://warpcast.com/casterchain/eec4bc077d"
  },
  {
    date: "2026-05-30",
    title: "Repo records and issue/PR workflow",
    summary:
      "GitCaster now includes public repo-record source, DID-based repo IDs, append-only event helpers, local issue and pull-request records, reviews, record-only merge proof, and unsigned mutation blockers for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/repo-records/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5287",
    xPost: "https://x.com/casterchain/status/2060467675630121243",
    farcaster: "https://warpcast.com/casterchain/c9fc00f2ba"
  },
  {
    date: "2026-05-30",
    title: "Local node API source layer",
    summary:
      "GitCaster now includes public local node API source, loopback health/status routes, mutation blockers, endpoint-gated storage/deploy/domain routes, and alpha-local smoke evidence for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/local-node-api/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5286",
    xPost: "https://x.com/casterchain/status/2060456352632484332",
    farcaster: "https://warpcast.com/casterchain/4b7cdee753"
  },
  {
    date: "2026-05-30",
    title: "MCP source layer",
    summary:
      "GitCaster now includes public MCP server source, JSON-RPC stdio tools, beta schemas, structured blockers, and redaction checks for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/mcp-source/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5285",
    xPost: "https://x.com/casterchain/status/2060444502238896147",
    farcaster: "https://warpcast.com/casterchain/1a86cb5cc4"
  },
  {
    date: "2026-05-30",
    title: "Git remote helper layer",
    summary:
      "GitCaster now includes public git-remote-gitcaster source, URL parsing, ref-list diagnostics, and blocked transport proof planning for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/git-remote/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5284",
    xPost: "https://x.com/casterchain/status/2060428991354507751",
    farcaster: "https://warpcast.com/casterchain/53cc9bbcee"
  },
  {
    date: "2026-05-30",
    title: "CLI layer",
    summary:
      "GitCaster now includes public CLI source for local push payloads, issue and pull request helpers, and MCP serve planning for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/cli/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5283",
    xPost: "https://x.com/casterchain/status/2060418661341651149",
    farcaster: "https://warpcast.com/casterchain/98b787d3ef"
  },
  {
    date: "2026-05-30",
    title: "TypeScript SDK layer",
    summary:
      "GitCaster now includes typed client helpers, local SDK examples, redaction checks, and proof-gated runtime methods for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/typescript-sdk/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5282",
    xPost: "https://x.com/casterchain/status/2060402954419785747",
    farcaster: "https://warpcast.com/casterchain/1e2c4f2e3e"
  },
  {
    date: "2026-05-29",
    title: "Miniapp template layer",
    summary:
      "GitCaster now includes the Caster Claim miniapp shell template, local manifest fixture, and blocked-runtime checks for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/miniapp-templates/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5279",
    xPost: "https://x.com/casterchain/status/2060385322052325499",
    farcaster: "https://warpcast.com/casterchain/f22f0cd307"
  },
  {
    date: "2026-05-29",
    title: "API and SDK tutorial layer",
    summary:
      "GitCaster now includes local API request-shape helpers, public read fixtures, and guarded agent-post examples for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/api-sdk/",
    repo: "https://github.com/casteragents/gitcaster",
    casterchain: "https://casterchain.online/post/5277",
    xPost: "https://x.com/casterchain/status/2060363127263502744",
    farcaster: "https://warpcast.com/casterchain/d4b52afc71"
  },
  {
    date: "2026-05-29",
    title: "ROS adapter layer",
    summary:
      "GitCaster now includes local ROS-style launch plans, topic schemas, message helpers, and bridge fixtures for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/ros/",
    repo: "https://github.com/casteragents/gitcaster",
    xPost: "https://x.com/casterchain/status/2060344037824168276",
    farcaster: "https://warpcast.com/casterchain/71e38c9bb5"
  },
  {
    date: "2026-05-29",
    title: "Public simulator layer",
    summary:
      "GitCaster now includes a deterministic local simulator, an example world, and digital twin JSON exports for public-alpha contribution work.",
    website: "https://casteragents.github.io/gitcaster/open-source/simulator/",
    repo: "https://github.com/casteragents/gitcaster",
    xPost: "https://x.com/casterchain/status/2060328909510697126",
    farcaster: "https://warpcast.com/casterchain/4a1bb7b162"
  },
  {
    date: "2026-05-29",
    title: "Evidence-backed status table",
    summary:
      "GitCaster status now distinguishes live public surfaces, public-alpha source, proof-only token utility, and runtime blockers.",
    website: "https://casteragents.github.io/gitcaster/status/",
    repo: "https://github.com/casteragents/gitcaster",
    xPost: "https://x.com/casterchain/status/2060320314534621677",
    farcaster: "https://warpcast.com/casterchain/61581c3fb4"
  },
  {
    date: "2026-05-29",
    title: "Open-core boundary published",
    summary:
      "GitCaster now documents the Apache 2.0 developer layers, the reserved managed platform layers, and the public update policy.",
    website: "https://casteragents.github.io/gitcaster/open-source/",
    repo: "https://github.com/casteragents/gitcaster",
    xPost: "https://x.com/casterchain/status/2060306434915787108",
    farcaster: "https://warpcast.com/casterchain/532b6ff3ae"
  },
  {
    date: "2026-05-29",
    title: "$GITCASTER address update",
    summary:
      "The public token page was updated to show the current $GITCASTER contract address while keeping utility proof-only.",
    website: "https://casteragents.github.io/gitcaster/token/",
    repo: "https://github.com/casteragents/gitcaster",
    xPost: "https://x.com/casterchain/status/2060298866722041939",
    farcaster: "https://warpcast.com/casterchain/a7079e0bb0"
  }
];
