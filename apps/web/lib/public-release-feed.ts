export type PublicReleaseFeedItem = {
  date: string;
  title: string;
  summary: string;
  website: string;
  repo: string;
  xPost: string;
  farcaster: string;
};

export const publicReleaseFeed: PublicReleaseFeedItem[] = [
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
