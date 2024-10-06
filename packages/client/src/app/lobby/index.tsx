// @refresh reset
"use client";
import TopBar from "./TopBar";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import { SPACING_REM, SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM } from "@/client_consts";
import GamesSection from "./games-section";
import UserList from "./UserList";
import ButtonBasic from "../components/atoms/ButtonBasic";
import quickStartGame from "./games-section/quick-start-game";
import { useWebsocketStore } from "@/stores/websocket-store";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import GithubLogo from "../../../public/github-logo.svg";
import DiscordLogo from "../../../public/discord-logo.svg";
import Link from "next/link";

export default function Lobby() {
  const socketOption = useWebsocketStore().socketOption;
  const usersContainerWidthMultiplier = Math.pow(GOLDEN_RATIO, 4);
  const usersContainerWidth = Math.floor(BASE_SCREEN_SIZE * usersContainerWidthMultiplier);

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
          className="h-full border-slate-400"
          style={{
            width: `calc(100% - ${usersContainerWidth}px)`,
          }}
        >
          <GamesSection />
        </div>
        <div
          id="users-container"
          className="h-full max-h-full"
          style={{
            width: `${usersContainerWidth}px`,
          }}
        >
          <UserList />
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
      <div className="absolute bottom-0 w-full p-7 flex items-center justify-center">
        <HoverableTooltipWrapper tooltipText="Start a single player game where you control one of each character type.">
          <ButtonBasic
            hotkey={"KeyS"}
            onClick={() => quickStartGame(socketOption)}
            extraStyles="h-20 pr-10 pl-10 text-xl bg-slate-950 text-slate-400"
          >
            PLAY NOW (S)
          </ButtonBasic>
        </HoverableTooltipWrapper>
        <div
          className="flex absolute right-0 bottom-0"
          style={{
            paddingRight: `${SPACING_REM_LARGE}rem`,
            paddingBottom: `${SPACING_REM_LARGE}rem`,
          }}
        >
          <Link
            href="https://github.com/snowdenwintermute/speed-dungeon"
            className="h-10 w-10 pointer-events-auto justify-self-end"
            style={{ marginRight: `${SPACING_REM}rem` }}
          >
            <GithubLogo className="h-full w-full fill-slate-700 border border-slate-400 rounded-full bg-slate-400" />
          </Link>
          <Link
            href="https://discord.gg/MyVPQf2Zzm"
            className="h-10 w-10 p-1 bg-slate-700 rounded-full pointer-events-auto justify-self-end border border-slate-400"
          >
            <DiscordLogo className="h-full w-full fill-slate-400" />
          </Link>
        </div>
      </div>
    </main>
  );
}
