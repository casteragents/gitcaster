export type WorldEntityKind = "agent" | "app" | "robot" | "service" | "asset";

export type WorldVector = {
  x: number;
  y: number;
  z?: number;
};

export type WorldEntity = {
  id: string;
  kind: WorldEntityKind;
  label: string;
  position: WorldVector;
  velocity?: WorldVector;
  metadata?: Record<string, string | number | boolean>;
};

export type SimulationWorld = {
  id: string;
  name: string;
  version: string;
  tickMs: number;
  bounds: {
    width: number;
    height: number;
    depth?: number;
  };
  entities: WorldEntity[];
};

export type SimulationFrame = {
  worldId: string;
  tick: number;
  elapsedMs: number;
  entities: WorldEntity[];
};

export type DigitalTwinExport = {
  format: "gitcaster.digital-twin.v1";
  world: {
    id: string;
    name: string;
    version: string;
    bounds: SimulationWorld["bounds"];
  };
  frame: SimulationFrame;
  generatedAt: string;
  deterministic: true;
  notes: string[];
};
