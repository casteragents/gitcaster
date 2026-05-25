import { CasterFooter } from "./CasterFooter";
import { CasterNav } from "./CasterNav";

export function CasterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <CasterNav />
      <main className="page">{children}</main>
      <CasterFooter />
    </div>
  );
}
