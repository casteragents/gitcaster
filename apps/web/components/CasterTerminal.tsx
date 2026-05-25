import { LOCAL_ALPHA_COMMANDS } from "../lib/caster-copy";

export function CasterTerminal({ lines = LOCAL_ALPHA_COMMANDS }: { lines?: string[] }) {
  return (
    <div className="terminal" aria-label="Local alpha command terminal">
      {lines.map((line) => <div key={line}>{line}</div>)}
    </div>
  );
}
