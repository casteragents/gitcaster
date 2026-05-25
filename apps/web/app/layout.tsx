import type { Metadata } from "next";
import "../styles/caster-theme.css";
import { CasterShell } from "../components/CasterShell";
import { sitePath } from "../lib/site-url";

export const metadata: Metadata = {
  title: "GitCaster",
  description: "Build apps. Run agents. Own the repo.",
  icons: {
    icon: sitePath("/favicon.svg")
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CasterShell>{children}</CasterShell>
      </body>
    </html>
  );
}
