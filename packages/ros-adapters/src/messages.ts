import type { RobotPose, RobotTwist, RosMessageKind, RosTopicMessage } from "./types.js";

const TOPIC_PATTERN = /^\/[a-z0-9][a-z0-9_/-]*$/;

export function validateTopicName(topic: string): string {
  if (!TOPIC_PATTERN.test(topic)) {
    throw new Error(`invalid ROS topic: ${topic}`);
  }
  if (topic.includes("//") || topic.endsWith("/")) {
    throw new Error(`unstable ROS topic: ${topic}`);
  }
  return topic;
}

export function createTopicMessage<TPayload extends Record<string, unknown>>(input: {
  topic: string;
  kind: RosMessageKind;
  createdAt?: string;
  payload: TPayload;
}): RosTopicMessage<TPayload> {
  return {
    format: "gitcaster.ros-message.v1",
    topic: validateTopicName(input.topic),
    kind: input.kind,
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    payload: input.payload
  };
}

export function createPoseMessage(topic: string, pose: RobotPose): RosTopicMessage<RobotPose & Record<string, unknown>> {
  return createTopicMessage({ topic, kind: "pose", payload: pose });
}

export function createTwistMessage(topic: string, twist: RobotTwist): RosTopicMessage<RobotTwist & Record<string, unknown>> {
  return createTopicMessage({ topic, kind: "twist", payload: twist });
}

export function createStatusMessage(topic: string, status: string): RosTopicMessage<{ status: string }> {
  return createTopicMessage({ topic, kind: "status", payload: { status } });
}

export function createTaskMessage(topic: string, taskId: string, instruction: string): RosTopicMessage<{ taskId: string; instruction: string }> {
  return createTopicMessage({ topic, kind: "task", payload: { taskId, instruction } });
}
