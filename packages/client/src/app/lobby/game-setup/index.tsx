import React from "react";
import UserList from "../UserList";
import GameSetupMenu from "./GameSetupMenu";
import CharacterAndPartySelection from "./CharacterAndPartySelection";

export function GameSetup() {
  return (
    <main className="min-h-screen w-screen flex justify-center">
      <div className="w-full max-w-[80rem] p-4 text-zinc-300 flex flex-col">
        <GameSetupMenu />
        <div className="w-full flex flex-1">
          <CharacterAndPartySelection />
          <UserList />
        </div>
      </div>
    </main>
  );
}
