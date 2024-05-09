// @refresh reset
"use client";

import GameList from "./GameList";
import LobbyMenu from "./LobbyMenu";
import WelcomeInfo from "./WelcomeInfo";

export default function Lobby() {
  return (
    <main className="h-full w-full text-zinc-300">
      <div className="p-4 h-screen max-h-screen max-w-[80rem] mx-auto flex flex-col">
        <LobbyMenu />
        <div className="flex flex-grow">
          <div className="flex flex-col flex-grow">
            <WelcomeInfo />
            <GameList />
          </div>
        </div>
      </div>
    </main>
  );
}
