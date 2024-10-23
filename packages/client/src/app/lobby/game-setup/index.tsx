import { GameMode, SpeedDungeonGame } from "@speed-dungeon/common";
import React from "react";
import ProgressionGameLobby from "./ProgressionGameLobby";
import RaceGameLobby from "./race-game-lobby/";

export function GameSetup({ game }: { game: SpeedDungeonGame }) {
  return (
    <main className="h-screen w-screen">
      {game.mode === GameMode.Progression && <ProgressionGameLobby game={game} />}
      {game.mode === GameMode.Race && <RaceGameLobby game={game} />}
    </main>
  );
}
