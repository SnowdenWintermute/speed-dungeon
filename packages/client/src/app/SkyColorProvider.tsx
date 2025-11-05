"use client";
import React, { ReactNode } from "react";
import { DungeonFloor, SKY_COLORS_BY_FLOOR } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

export const SkyColorProvider = observer(({ children }: { children: ReactNode }) => {
  const partyOption = AppStore.get().gameStore.getPartyOption();
  const currentFloorOption = partyOption?.dungeonExplorationManager.getCurrentFloor();
  const currentFloor = currentFloorOption !== undefined ? currentFloorOption % 10 : 0;
  const skyColor = SKY_COLORS_BY_FLOOR[currentFloor as DungeonFloor];

  return <div style={{ background: skyColor }}>{children}</div>;
});
