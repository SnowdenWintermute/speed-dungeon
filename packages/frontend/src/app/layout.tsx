import type { Metadata } from "next";
import "./globals.css";
import { DungeonFloor, SKY_COLORS_BY_FLOOR } from "@speed-dungeon/common";
import { AlertManager } from "./components/alerts/AlertManager";
import { AppProviders } from "./AppProviders";
import { themeCssVariables } from "@speed-dungeon/ui/theme";

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
        style={{
          background: SKY_COLORS_BY_FLOOR[DungeonFloor.Zero],
          ...themeCssVariables("slate"),
        }}
      >
        <AppProviders>
          <AlertManager />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
