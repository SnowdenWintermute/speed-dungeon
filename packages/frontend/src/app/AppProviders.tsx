"use client";
import { ReactNode } from "react";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { ClientApplicationProvider } from "./client-application-provider";
import { ZIndexLayers } from "./z-index-layers";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ClientApplicationProvider>
      <UiProvider layers={UI_LAYERS}>{children}</UiProvider>
    </ClientApplicationProvider>
  );
}
