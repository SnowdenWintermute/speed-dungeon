import { GameMode } from "@speed-dungeon/common";
import React from "react";
import ProgressionGameLobby from "./ProgressionGameLobby";
import RaceGameLobby from "./race-game-lobby/";
import { ZIndexLayers } from "@/app/z-index-layers";

export function GameSetup({ gameMode }: { gameMode: GameMode }) {
  return (
    <main
      className={`h-screen w-screen absolute overflow-hidden`}
      style={{ zIndex: ZIndexLayers.LobbyGameSetup }}
    >
      {gameMode === GameMode.Progression && <ProgressionGameLobby />}
      {gameMode === GameMode.Race && <RaceGameLobby />}
    </main>
  );
}
