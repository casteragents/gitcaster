import { PRODUCT } from "./caster-copy";

export const previewNode = {
  type: "gitcaster.preview.node.v1",
  status: "preview",
  label: "Preview data - connect NEXT_PUBLIC_GITCASTER_NODE_URL to show Caster node telemetry after proof exists.",
  nodes: PRODUCT.nodes.map((name) => ({
    name,
    status: "blocked",
    reason: "No signed public node health proof yet."
  }))
};

export const previewEvidence = {
  type: "gitcaster.preview.evidence.v1",
  status: "preview",
  label: "Preview evidence list - generated launch/evidence files are linked when present.",
  evidence: []
};

export const previewRepos = {
  type: "gitcaster.preview.repos.v1",
  status: "preview",
  label: "Preview repos - start a local alpha node to show real repo data.",
  repos: []
};

export const previewEcosystem = {
  type: "gitcaster.preview.ecosystem.v1",
  status: "preview",
  label: "Preview ecosystem - canonical Caster ecosystem import is PR-13.",
  entries: [
    { name: "Caster Intelligence", status: "preview", sensitivity: "needs-review" },
    { name: "Caster-A1", status: "preview", sensitivity: "needs-review" },
    { name: "Caster Claim Miniapp", status: "preview", sensitivity: "public" },
    { name: "CasterAgents", status: "preview", sensitivity: "sensitive" },
    { name: "Caster Punks", status: "preview", sensitivity: "public-index-only" }
  ]
};
