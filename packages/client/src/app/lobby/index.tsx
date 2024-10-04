// @refresh reset
"use client";

import { useGameStore } from "@/stores/game-store";
import TopBar from "./TopBar";
import { GOLDEN_RATIO } from "@speed-dungeon/common";
import { TOP_BAR_HEIGHT_REM } from "@/client_consts";

export default function Lobby() {
  const username = useGameStore().username;
  // top bar
  // - logo
  // - app title
  // - app version info button
  // - user icon button
  // main container
  // - games container
  // - users list
  // - login form container
  //   * login form
  // bottom bar
  // - quick start button
  // - quick start button popover info
  const usersContainerWidthMultiplier = Math.pow(GOLDEN_RATIO, 4);
  const baseScreenSize = 1920;
  const usersContainerWidth = Math.floor(baseScreenSize * usersContainerWidthMultiplier);
  const authContainerWidth = Math.floor(baseScreenSize * Math.pow(GOLDEN_RATIO, 3));
  console.log(authContainerWidth);
  return (
    <main className="h-full w-full text-zinc-300 relative">
      <TopBar />
      <section
        id="games-and-users"
        className={`w-full`}
        style={{
          height: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
        }}
      >
        <div
          id="games-container"
          className="h-full border-r border-slate-400 inline-block bg-black opacity-50"
          style={{
            width: `calc(100% - ${usersContainerWidth}px)`,
          }}
        >
          games container
        </div>
        <div
          id="users-container"
          className="h-full inline-block bg-black"
          style={{
            width: `${usersContainerWidth}px`,
          }}
        >
          users container
        </div>
      </section>
      <section
        id="auth-form-container"
        className="absolute bg-blue-500 h-full top-0 right-0 opacity-15 flex items-center text-black border-8 border-red-900"
        style={{
          width: `calc(100% * ${1 - GOLDEN_RATIO})`,
          minWidth: `${authContainerWidth}px`,
          maxWidth: "100vw !important",
        }}
      >
        auth form container
      </section>
      <section id="quick-start-button-container">
        <div id="quick-start-button"></div>
      </section>
    </main>
  );
}
