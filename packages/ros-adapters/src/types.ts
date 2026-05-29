export type RosMessageKind = "pose" | "twist" | "status" | "task";

export type RosDirection = "publish" | "subscribe";

export type RobotPose = {
  frameId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
};

export type RobotTwist = {
  linearX: number;
  linearY: number;
  angularZ: number;
};

export type RosTopicMessage<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  format: "gitcaster.ros-message.v1";
  topic: string;
  kind: RosMessageKind;
  createdAt: string;
  payload: TPayload;
};

export type RosTopicBridge = {
  topic: string;
  direction: RosDirection;
  kind: RosMessageKind;
  schema: string;
};

export type RosLaunchNode = {
  id: string;
  packageName: string;
  executable: string;
  args: string[];
  topics: RosTopicBridge[];
  mode: "local-only";
  network: "disabled";
};

export type RosLaunchPlan = {
  format: "gitcaster.ros-launch.v1";
  id: string;
  label: string;
  mode: "local-only";
  nodes: RosLaunchNode[];
  notes: string[];
};

export type GitCasterRosBridgeEvent = {
  format: "gitcaster.ros-bridge-event.v1";
  launchId: string;
  nodeId: string;
  topic: string;
  kind: RosMessageKind;
  direction: RosDirection;
  summary: string;
};
