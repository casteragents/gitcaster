import { createBridgeTopic, createLocalBridgeLaunchPlan } from "./launch.js";

export const localAgentBridgeLaunchPlan = createLocalBridgeLaunchPlan({
  id: "local-agent-bridge",
  label: "Local agent bridge",
  nodes: [
    {
      id: "agent-state-publisher",
      packageName: "@gitcaster/ros-adapters",
      executable: "publish-agent-state",
      args: ["--fixture", "local-agent-grid"],
      topics: [
        createBridgeTopic("/gitcaster/local/pose", "publish", "pose"),
        createBridgeTopic("/gitcaster/local/status", "publish", "status")
      ]
    },
    {
      id: "app-task-subscriber",
      packageName: "@gitcaster/ros-adapters",
      executable: "read-app-task",
      args: ["--fixture", "local-agent-grid"],
      topics: [createBridgeTopic("/gitcaster/local/task", "subscribe", "task")]
    }
  ],
  notes: [
    "Public alpha fixture for local developer bridge tests.",
    "Network access is disabled and managed platform operations are out of scope."
  ]
});
