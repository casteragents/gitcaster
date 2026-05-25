import type { Metadata } from "next";
import "../styles/caster-theme.css";
import { CasterShell } from "../components/CasterShell";

const basePath = process.env.GITCASTER_PAGES_BASE_PATH || "";

export const metadata: Metadata = {
  title: "GitCaster",
  description: "Build apps. Run agents. Own the repo.",
  icons: {
    icon: `${basePath}/favicon.svg`
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
