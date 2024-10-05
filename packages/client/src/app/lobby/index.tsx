// @refresh reset
"use client";

import { useGameStore } from "@/stores/game-store";
import TopBar from "./TopBar";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import { TOP_BAR_HEIGHT_REM } from "@/client_consts";
import GamesSection from "./games-section";

export default function Lobby() {
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
  const usersContainerWidth = Math.floor(BASE_SCREEN_SIZE * usersContainerWidthMultiplier);
  const authContainerWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 2));
  console.log(authContainerWidth);
  return (
    <main className="h-full w-full text-zinc-300 relative">
      <TopBar />
      <section
        id="games-and-users"
        className={`w-full flex`}
        style={{
          height: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
        }}
      >
        <div
          id="games-container"
          className="h-full border-r-2 border-slate-400"
          style={{
            width: `calc(100% - ${usersContainerWidth}px)`,
          }}
        >
          <GamesSection />
        </div>
        <div
          id="users-container"
          className="h-full"
          style={{
            width: `${usersContainerWidth}px`,
          }}
        >
          users container
        </div>
      </section>
      {
        // <section
        //   id="auth-form-container"
        //   className="absolute h-full top-0 right-0 flex items-center border-l-2 border-red-900"
        //   style={{
        // width: `${authContainerWidth}px`,
        //  maxWidth: "100%",
        //   }}
        // >
        //   auth form container
        //   </section>
        //   <section id="quick-start-button-container">
        //   <div id="quick-start-button"></div>
        //   </section>
      }
    </main>
  );
}
