import { localAgentGridWorld } from "./example-world.js";
import { createInitialFrame, exportDigitalTwin, runWorld, stepWorld } from "./simulator.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const initial = createInitialFrame(localAgentGridWorld);
assert(initial.tick === 0, "initial tick should be zero");
assert(initial.entities.length === 3, "initial frame should include all entities");

const first = stepWorld(localAgentGridWorld, initial);
assert(first.tick === 1, "first frame should advance one tick");
assert(first.elapsedMs === 250, "first frame should advance elapsed milliseconds");
assert(first.entities[0]?.position.x === 1.125, "builder x position should move deterministically");
assert(first.entities[0]?.position.y === 1.0625, "builder y position should move deterministically");

const fourth = runWorld(localAgentGridWorld, 4);
assert(fourth.tick === 4, "fourth frame should have tick 4");
assert(fourth.elapsedMs === 1000, "fourth frame should have one second elapsed");
assert(fourth.entities[0]?.position.x === 1.5, "builder x position should match one-second movement");
assert(fourth.entities[2]?.position.y === 5.5, "runner y position should match one-second movement");

const twin = exportDigitalTwin(localAgentGridWorld, fourth);
assert(twin.format === "gitcaster.digital-twin.v1", "digital twin format should be stable");
assert(twin.deterministic === true, "digital twin export should be deterministic");
assert(twin.frame.entities.length === 3, "digital twin export should preserve entities");
assert(twin.notes.every((note) => !/secret|private key|custody key/i.test(note)), "notes should not include secret-like material");

console.log(JSON.stringify({ status: "passed", package: "@gitcaster/simulator", world: localAgentGridWorld.id, tick: fourth.tick }));
