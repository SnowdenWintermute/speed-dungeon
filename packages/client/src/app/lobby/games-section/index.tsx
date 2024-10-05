// @refresh reset
"use client";
import { useWebsocketStore } from "@/stores/websocket-store";
import { FormEvent, useState } from "react";
import { BASE_SCREEN_SIZE, ClientToServerEvent, GOLDEN_RATIO } from "@speed-dungeon/common";
import ButtonBasic from "../../components/atoms/ButtonBasic";
import { setAlert } from "../../components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";

export default function GamesSection() {
  const socketOption = useWebsocketStore().socketOption;
  const [gameName, setGameName] = useState("");
  const mutateAlertStore = useAlertStore().mutateState;

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    socketOption?.emit(ClientToServerEvent.CreateGame, gameName);
  }

  function refreshGameList() {
    socketOption?.emit(ClientToServerEvent.RequestsGameList);
  }

  return (
    <div
      id="games-section"
      className="w-full h-full bg-slate-700 "
      style={{
        padding: `${SPACING_REM_LARGE}rem`,
      }}
    >
      <div
        id="current-games-container"
        className="border border-slate-400 pointer-events-auto"
        style={{ width: `calc(${BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 4)})` }}
      >
        <div
          className="text-lg h-10 flex items-center w-1/2"
          style={{ paddingLeft: `${SPACING_REM_SMALL}rem` }}
        >
          Current Games
        </div>
      </div>
      <form id="create-game-form"> game form</form>
    </div>
  );
}
