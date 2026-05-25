import { CasterTerminal } from "../../components/CasterTerminal";

const startLines = [
  "Target hosted install command - not active until release evidence exists.",
  "$ curl -fsSL https://gitcaster.casterchain/install.sh | sh",
  "",
  "Local alpha:",
  "$ node scripts/install-local-gc.cjs",
  "$ gc identity new",
  "$ gc identity show",
  "$ gc node start --alpha-local",
  "$ gc repo create hello-gitcaster --description \"first GitCaster repo\"",
  "$ gc repo push-local hello-gitcaster --path ./hello-gitcaster",
  "$ gc mcp serve",
  "",
  "Target Git remote command - not claimed working until Git transport RC evidence passes.",
  "$ git remote add origin gitcaster://did:caster:z.../hello-gitcaster",
  "$ git push origin main"
];

export default function StartPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Start</div>
        <h1>Local alpha path</h1>
        <p className="lede">Use local commands first. Hosted installer and normal Git transport need release evidence before they receive stronger labels.</p>
      </div>
      <CasterTerminal lines={startLines} />
    </div>
  );
}
