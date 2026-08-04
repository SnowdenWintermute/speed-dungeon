import type { Metadata } from "next";
import "./globals.css";
import { DungeonFloor, SKY_COLORS_BY_FLOOR } from "@speed-dungeon/common";
import { ClientApplicationProvider } from "./client-application-provider";
import { AlertManager } from "./components/alerts/AlertManager";
import { UiProvider } from "./components/atoms/ui-context";
import { themeCssVariables } from "./components/atoms/theme";
import { ZIndexLayers } from "./z-index-layers";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };
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
        <ClientApplicationProvider>
          <UiProvider layers={UI_LAYERS}>
            <AlertManager />
            {children}
          </UiProvider>
        </ClientApplicationProvider>
      </body>
    </html>
  );
}
