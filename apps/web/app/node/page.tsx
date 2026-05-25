import { NodePreviewPanel } from "../../components/NodePreviewPanel";

export default function NodePage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Node preview</div>
        <h1>Caster node surfaces</h1>
        <p className="lede">node.gitcaster.casterchain, node2.gitcaster.casterchain, and node3.gitcaster.casterchain are blocked until signed public node health proof exists.</p>
      </div>
      <NodePreviewPanel />
    </div>
  );
}
