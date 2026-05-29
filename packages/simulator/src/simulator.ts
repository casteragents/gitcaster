import type { DigitalTwinExport, SimulationFrame, SimulationWorld, WorldEntity, WorldVector } from "./types.js";

function cloneEntity(entity: WorldEntity): WorldEntity {
  return {
    ...entity,
    position: { ...entity.position },
    velocity: entity.velocity ? { ...entity.velocity } : undefined,
    metadata: entity.metadata ? { ...entity.metadata } : undefined
  };
}

function addVector(position: WorldVector, velocity: WorldVector | undefined, scale: number): WorldVector {
  if (!velocity) return { ...position };
  return {
    x: position.x + velocity.x * scale,
    y: position.y + velocity.y * scale,
    z: position.z === undefined && velocity.z === undefined ? undefined : (position.z || 0) + (velocity.z || 0) * scale
  };
}

function clampVector(position: WorldVector, world: SimulationWorld): WorldVector {
  return {
    x: Math.max(0, Math.min(world.bounds.width, position.x)),
    y: Math.max(0, Math.min(world.bounds.height, position.y)),
    z:
      position.z === undefined && world.bounds.depth === undefined
        ? undefined
        : Math.max(0, Math.min(world.bounds.depth || 0, position.z || 0))
  };
}

export function createInitialFrame(world: SimulationWorld): SimulationFrame {
  return {
    worldId: world.id,
    tick: 0,
    elapsedMs: 0,
    entities: world.entities.map(cloneEntity)
  };
}

export function stepWorld(world: SimulationWorld, frame: SimulationFrame = createInitialFrame(world)): SimulationFrame {
  const scale = world.tickMs / 1000;
  return {
    worldId: world.id,
    tick: frame.tick + 1,
    elapsedMs: frame.elapsedMs + world.tickMs,
    entities: frame.entities.map((entity) => ({
      ...cloneEntity(entity),
      position: clampVector(addVector(entity.position, entity.velocity, scale), world)
    }))
  };
}

export function runWorld(world: SimulationWorld, ticks: number): SimulationFrame {
  if (!Number.isInteger(ticks) || ticks < 0) {
    throw new Error("ticks must be a non-negative integer");
  }

  let frame = createInitialFrame(world);
  for (let index = 0; index < ticks; index += 1) {
    frame = stepWorld(world, frame);
  }
  return frame;
}

export function exportDigitalTwin(world: SimulationWorld, frame: SimulationFrame, generatedAt = "1970-01-01T00:00:00.000Z"): DigitalTwinExport {
  if (frame.worldId !== world.id) {
    throw new Error("frame worldId does not match world id");
  }

  return {
    format: "gitcaster.digital-twin.v1",
    world: {
      id: world.id,
      name: world.name,
      version: world.version,
      bounds: { ...world.bounds }
    },
    frame: {
      ...frame,
      entities: frame.entities.map(cloneEntity)
    },
    generatedAt,
    deterministic: true,
    notes: [
      "Local developer export only.",
      "Does not include managed orchestration, production scheduling, custody, billing, or operator credentials."
    ]
  };
}
