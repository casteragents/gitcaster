import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["ROS adapter package", "packages/ros-adapters", "Local launch plan, topic, and message helpers for developer bridge tests."],
  ["Bridge fixture", "examples/ros/local-agent-bridge.launch.json", "A deterministic local bridge plan with networking disabled."],
  ["Message schema", "packages/ros-adapters/src/messages.ts", "Stable message helpers for pose, twist, status, and task events."]
];

const workflow = [
  ["Create a launch plan", "Describe local agent/app bridge nodes and topics."],
  ["Validate the boundary", "Reject remote-looking endpoints and direct robot-control commands."],
  ["Export evidence", "Use fixture JSON and package tests as public-alpha proof."]
];

const reservedArtifacts = [
  "Managed orchestration and account operations",
  "High-scale simulation cluster scheduling",
  "Enterprise fleet dashboard and private policy controls",
  "Operator credentials, custody, billing, and production deployment commands",
  "Physical robot command execution"
];

export default function RosOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>ROS adapters for local GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes ROS-style adapter helpers so developers can
          model local agent/app bridge topics, fixtures, and launch plans without
          exposing managed CasterCloud operations.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/ros-adapters">ROS source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/ros">Bridge fixtures</a>
          <a className="button" href={sitePath("/status")}>Status proof</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These are safe contribution surfaces for local robotics and agent development.</p>
          </div>
          <span className="pill good">public-alpha</span>
        </div>
        <div className="grid">
          {publicArtifacts.map(([name, path, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
              <span className="pill info">{path}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Local workflow</h2>
            <p>The package is built for repeatable local checks before stronger labels are used.</p>
          </div>
          <span className="pill info">deterministic</span>
        </div>
        <div className="grid">
          {workflow.map(([name, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Commercial boundary</h2>
            <p>The adapters are public; the managed platform remains reserved.</p>
          </div>
          <span className="pill warn">reserved</span>
        </div>
        <div className="grid">
          {reservedArtifacts.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
