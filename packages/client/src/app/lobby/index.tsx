// @refresh reset
"use client";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import { SPACING_REM, SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM } from "@/client_consts";
import GamesSection from "./games-section";
import UserList from "./user-list/";
import quickStartGame from "./games-section/quick-start-game";
import { useWebsocketStore } from "@/stores/websocket-store";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import GithubLogo from "../../../public/github-logo.svg";
import DiscordLogo from "../../../public/discord-logo.svg";
import Link from "next/link";
import AuthForm from "./auth-form";
import WithTopBar from "../components/layouts/with-top-bar";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useEffect } from "react";
import { useLobbyStore } from "@/stores/lobby-store";

export default function Lobby() {
  const socketOption = useWebsocketStore().socketOption;
  const usersContainerWidthMultiplier = Math.pow(GOLDEN_RATIO, 4);
  const usersContainerWidth = Math.floor(BASE_SCREEN_SIZE * usersContainerWidthMultiplier);
  const currentSessionHttpResponseTracker = useHttpRequestStore().requests["get session"];
  const mutateLobbyState = useLobbyStore().mutateState;
  const showAuthForm = useLobbyStore().showAuthForm;

  useEffect(() => {
    if (currentSessionHttpResponseTracker?.statusCode === 200)
      mutateLobbyState((state) => {
        state.showAuthForm = false;
      });
  }, [currentSessionHttpResponseTracker]);

  return (
    <WithTopBar>
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
      <section
        id="auth-form-container"
        className="absolute h-full w-full top-0 right-0 flex items-center justify-center"
      >
        {showAuthForm &&
          currentSessionHttpResponseTracker &&
          currentSessionHttpResponseTracker?.statusCode !== 200 &&
          !currentSessionHttpResponseTracker?.loading && <AuthForm />}
      </section>
      <div className="absolute bottom-0 w-full p-7 flex items-center justify-center">
        <HoverableTooltipWrapper tooltipText="Start a single player game where you control one of each character type">
          <button
            onClick={() => quickStartGame(socketOption)}
            className={`border border-slate-400 h-20 cursor-pointer pr-10 pl-10 
            flex justify-center items-center disabled:opacity-50 pointer-events-auto disabled:cursor-auto
            text-xl bg-slate-950 text-slate-400
            `}
          >
            PLAY NOW
          </button>
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
    </WithTopBar>
  );
}
