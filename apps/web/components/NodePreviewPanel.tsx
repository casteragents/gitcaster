import { previewNode } from "../lib/preview-data";
import { TruthStatusPill } from "./TruthStatusPill";

export function NodePreviewPanel() {
  return (
    <div className="grid">
      {previewNode.nodes.map((node) => (
        <div className="card" key={node.name}>
          <h3>{node.name}</h3>
          <p>{node.reason}</p>
          <TruthStatusPill status="blocked" />
        </div>
      ))}
    </div>
  );
}
