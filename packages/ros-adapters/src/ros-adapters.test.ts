import { localAgentBridgeLaunchPlan } from "./example-bridge.js";
import { assertLocalOnlyLaunchPlan, summarizeLaunchPlan } from "./launch.js";
import { createPoseMessage, createStatusMessage, createTaskMessage, validateTopicName } from "./messages.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const plan = assertLocalOnlyLaunchPlan(localAgentBridgeLaunchPlan);
assert(plan.format === "gitcaster.ros-launch.v1", "launch format should be stable");
assert(plan.mode === "local-only", "launch plan should be local-only");
assert(plan.nodes.length === 2, "launch plan should include two local nodes");
assert(plan.nodes.every((node) => node.network === "disabled"), "all node networking should be disabled");

const summary = summarizeLaunchPlan(plan);
assert(summary.length === 3, "summary should include every bridge topic");
assert(summary[0]?.topic === "/gitcaster/local/pose", "pose topic should be deterministic");
assert(summary[2]?.direction === "subscribe", "task topic should be subscribed");

const pose = createPoseMessage("/gitcaster/local/pose", { frameId: "map", x: 1, y: 2, z: 0, yaw: 0.25 });
assert(pose.payload.frameId === "map", "pose payload should be preserved");
assert(pose.createdAt === "1970-01-01T00:00:00.000Z", "default timestamp should be deterministic");

const status = createStatusMessage("/gitcaster/local/status", "ready");
assert(status.payload.status === "ready", "status payload should be preserved");

const task = createTaskMessage("/gitcaster/local/task", "task-001", "inspect local fixture");
assert(task.payload.taskId === "task-001", "task id should be preserved");

let invalidTopicRejected = false;
try {
  validateTopicName("http://example.invalid/topic");
} catch {
  invalidTopicRejected = true;
}
assert(invalidTopicRejected, "remote-looking topic should be rejected");

const serialized = JSON.stringify({ plan, summary, pose, status, task });
assert(!/(https?:\/\/|wss?:\/\/|ssh:\/\/|tcp:\/\/|udp:\/\/)/i.test(serialized), "fixtures should not include network endpoints");
assert(!/(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer|mnemonic|seed phrase)/i.test(serialized), "fixtures should not include credential material");

console.log(JSON.stringify({ status: "passed", package: "@gitcaster/ros-adapters", launch: plan.id, topics: summary.length }));
