export const GITCASTER_PROTOCOL_FIXTURES = [
  {
    name: "caster-identity",
    path: "fixtures/protocol/caster-identity.json",
  },
  {
    name: "signed-mutation.repo-create",
    path: "fixtures/protocol/signed-mutation.repo-create.json",
  },
  {
    name: "ref-certificate.main",
    path: "fixtures/protocol/ref-certificate.main.json",
  },
  {
    name: "object-manifest.local-alpha",
    path: "fixtures/protocol/object-manifest.local-alpha.json",
  },
  {
    name: "node-health.alpha-local",
    path: "fixtures/protocol/node-health.alpha-local.json",
  },
] as const;

export type GitCasterProtocolFixtureName = (typeof GITCASTER_PROTOCOL_FIXTURES)[number]["name"];
