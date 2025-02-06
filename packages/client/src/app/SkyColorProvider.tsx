"use client";
import React, { ReactNode } from "react";
import { DungeonFloor, SKY_COLORS_BY_FLOOR } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";

export default function SkyColorProvider({ children }: { children: ReactNode }) {
  const currentFloor = useGameStore((state) => {
    const partyOption = getCurrentParty(state, state.username || "");
    return partyOption?.currentFloor !== undefined ? partyOption?.currentFloor % 10 : 1;
  });
  const skyColor = SKY_COLORS_BY_FLOOR[currentFloor as DungeonFloor];

  return <div style={{ background: skyColor }}>{children}</div>;
}
