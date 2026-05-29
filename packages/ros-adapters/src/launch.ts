import { validateTopicName } from "./messages.js";
import type { GitCasterRosBridgeEvent, RosLaunchNode, RosLaunchPlan, RosTopicBridge } from "./types.js";

const REMOTE_PATTERN = /(https?:\/\/|wss?:\/\/|ssh:\/\/|tcp:\/\/|udp:\/\/|\b\d{1,3}(?:\.\d{1,3}){3}\b|localhost:\d+|127\.0\.0\.1:\d+)/i;
const CONTROL_PATTERN = /\b(move_base|cmd_vel|actuator|motor|servo|gripper|takeoff|land|emergency_stop)\b/i;

export function createBridgeTopic(topic: string, direction: RosTopicBridge["direction"], kind: RosTopicBridge["kind"]): RosTopicBridge {
  return {
    topic: validateTopicName(topic),
    direction,
    kind,
    schema: `gitcaster.ros.${kind}.v1`
  };
}

export function createLocalBridgeLaunchPlan(input: {
  id: string;
  label: string;
  nodes: Array<Omit<RosLaunchNode, "mode" | "network">>;
  notes?: string[];
}): RosLaunchPlan {
  const plan: RosLaunchPlan = {
    format: "gitcaster.ros-launch.v1",
    id: input.id,
    label: input.label,
    mode: "local-only",
    nodes: input.nodes.map((node) => ({
      ...node,
      args: [...node.args],
      topics: node.topics.map((topic) => ({ ...topic, topic: validateTopicName(topic.topic) })),
      mode: "local-only",
      network: "disabled"
    })),
    notes: input.notes ?? [
      "Local adapter plan for developer tests.",
      "No hosted orchestration, remote endpoint, custody flow, or external robot controller is used."
    ]
  };
  assertLocalOnlyLaunchPlan(plan);
  return plan;
}

export function assertLocalOnlyLaunchPlan(plan: RosLaunchPlan): RosLaunchPlan {
  const serialized = JSON.stringify(plan);
  if (plan.mode !== "local-only") throw new Error("launch plan must be local-only");
  if (REMOTE_PATTERN.test(serialized)) throw new Error("launch plan must not contain network endpoints");
  if (CONTROL_PATTERN.test(serialized)) throw new Error("launch plan must not contain direct robot-control commands");
  for (const node of plan.nodes) {
    if (node.mode !== "local-only") throw new Error(`node ${node.id} must be local-only`);
    if (node.network !== "disabled") throw new Error(`node ${node.id} network must be disabled`);
    for (const topic of node.topics) validateTopicName(topic.topic);
  }
  return plan;
}

export function summarizeLaunchPlan(plan: RosLaunchPlan): GitCasterRosBridgeEvent[] {
  assertLocalOnlyLaunchPlan(plan);
  return plan.nodes.flatMap((node) =>
    node.topics.map((topic) => ({
      format: "gitcaster.ros-bridge-event.v1",
      launchId: plan.id,
      nodeId: node.id,
      topic: topic.topic,
      kind: topic.kind,
      direction: topic.direction,
      summary: `${node.id} ${topic.direction}s ${topic.kind} on ${topic.topic}`
    }))
  );
}
