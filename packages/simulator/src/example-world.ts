import type { SimulationWorld } from "./types.js";

export const localAgentGridWorld: SimulationWorld = {
  id: "local-agent-grid",
  name: "Local Agent Grid",
  version: "0.1.0-alpha",
  tickMs: 250,
  bounds: {
    width: 12,
    height: 8,
    depth: 3
  },
  entities: [
    {
      id: "agent-builder",
      kind: "agent",
      label: "Builder agent",
      position: { x: 1, y: 1, z: 0 },
      velocity: { x: 0.5, y: 0.25, z: 0 },
      metadata: {
        role: "build-plan",
        public: true
      }
    },
    {
      id: "app-preview",
      kind: "app",
      label: "Preview miniapp",
      position: { x: 5, y: 4, z: 0 },
      metadata: {
        route: "/ecosystem/caster-claim-miniapp",
        public: true
      }
    },
    {
      id: "robot-runner",
      kind: "robot",
      label: "Local runner",
      position: { x: 2, y: 6, z: 0 },
      velocity: { x: 0.25, y: -0.5, z: 0 },
      metadata: {
        mode: "simulated",
        public: true
      }
    }
  ]
};
