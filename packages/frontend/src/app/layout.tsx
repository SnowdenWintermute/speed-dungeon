import type { Metadata } from "next";
import "./globals.css";
import { DungeonFloor, SKY_COLORS_BY_FLOOR } from "@speed-dungeon/common";
import { ClientApplicationProvider } from "./client-application-provider";
import { TooltipManager } from "./TooltipManager";
import { AlertManager } from "./components/alerts/AlertManager";
export const metadata: Metadata = {
  title: "Speed Dungeon",
  description: "A cooperative RPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="box-border h-screen w-screen text-zinc-300 relative pointer-events-none"
        style={{ background: SKY_COLORS_BY_FLOOR[DungeonFloor.Zero] }}
      >
        <ClientApplicationProvider>
          {/* tooltips and alerts belong to every page, so what renders them is layout-level. both
              were under the game's own page, which is why they did nothing on a ladder page — and
              the connection alert the provider raises is one any page can trigger */}
          <TooltipManager />
          <AlertManager />
          {children}
        </ClientApplicationProvider>
      </body>
    </html>
  );
}
