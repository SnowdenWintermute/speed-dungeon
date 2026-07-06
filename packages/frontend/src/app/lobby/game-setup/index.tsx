import { GameMode } from "@speed-dungeon/common";
import React from "react";
import { RaceGameLobby } from "./race-game-lobby/";
import { ZIndexLayers } from "@/app/z-index-layers";

export function GameSetup({ gameMode }: { gameMode: GameMode }) {
  return (
    <main
      className={`h-screen w-screen absolute overflow-hidden`}
      style={{ zIndex: ZIndexLayers.LobbyGameSetup }}
    >
      <RaceGameLobby />
    </main>
  );
}
