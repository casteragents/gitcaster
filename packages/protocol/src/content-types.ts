export const GITCASTER_CONTENT_TYPES = [
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
] as const;

export type GitCasterContentType = (typeof GITCASTER_CONTENT_TYPES)[number];
