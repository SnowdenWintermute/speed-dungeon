// @refresh reset
"use client";
import { useWebsocketStore } from "@/stores/websocket-store";
import { FormEvent, useState } from "react";
import { BASE_SCREEN_SIZE, ClientToServerEvent, GOLDEN_RATIO } from "@speed-dungeon/common";
import ButtonBasic from "../../components/atoms/ButtonBasic";
import { setAlert } from "../../components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import TextSubmit from "@/app/components/molocules/TextSubmit";

export default function GamesSection() {
  const socketOption = useWebsocketStore().socketOption;
  const [gameName, setGameName] = useState("");
  const [gameListRefreshedAt, setGameListRefreshedAt] = useState(Date.now());
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
      className="w-full h-full flex"
      style={{
        padding: `${SPACING_REM_LARGE}rem`,
        width: `calc(${BASE_SCREEN_SIZE}px * ${Math.pow(GOLDEN_RATIO, 2)})`,
        maxWidth: "100%",
      }}
    >
      <div
        id="current-games-container"
        className="pointer-events-auto w-1/2 h-fit"
        style={{
          paddingRight: `${SPACING_REM_SMALL / 2}rem`,
        }}
      >
        <div
          className="text-lg h-10 flex items-center border border-slate-400 bg-slate-700"
          style={{
            paddingLeft: `${SPACING_REM_SMALL}rem`,
          }}
        >
          Current Games
        </div>
        <ul>
          <li>Last refreshed at {new Date(gameListRefreshedAt).toLocaleTimeString()}</li>
        </ul>
      </div>
      <div
        id="create-game-form"
        className="pointer-events-auto"
        style={{
          paddingLeft: `${SPACING_REM_SMALL / 2}rem`,
        }}
      >
        <form className="flex" onSubmit={createGame}>
          <input
            className="bg-slate-700 border border-slate-400 h-10 p-4"
            type="text"
            name="game name"
            placeholder="Game name..."
            onChange={(e) => setGameName(e.target.value)}
            value={gameName}
          />
          <ButtonBasic buttonType="submit" extraStyles="border-l-0 bg-slate-700">
            CREATE
          </ButtonBasic>
        </form>
      </div>
    </div>
  );
}
