import { GameMode, SpeedDungeonGame } from "@speed-dungeon/common";
import React from "react";
import ProgressionGameLobby from "./ProgressionGameLobby";
import { SPACING_REM_LARGE } from "@/client_consts";

export function GameSetup({ game }: { game: SpeedDungeonGame }) {
  return (
    <main className="h-screen w-screen" style={{ padding: `${SPACING_REM_LARGE}rem` }}>
      {game.mode === GameMode.Progression && <ProgressionGameLobby game={game} />}
    </main>
  );
}

// <GameSetupMenu />
// <div className="w-full flex flex-1">
//   <CharacterAndPartySelection />
//   <UserList />
// </div>
