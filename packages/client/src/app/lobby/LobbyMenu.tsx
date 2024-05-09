// @refresh reset
"use client";
import { useWebsocketStore } from "@/stores/websocket-store";
import { FormEvent, useState } from "react";
import { ClientToServerEvent } from "@speed-dungeon/common";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { useLobbyStore } from "@/stores/lobby-store";

export default function LobbyMenu() {
  const socketOption = useWebsocketStore().socketOption;
  const [gameName, setGameName] = useState("");

  const username = useLobbyStore().username;
  const firstLetterOfUsername = username ? username.charAt(0) : "?";

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (socketOption) {
      socketOption.emit(ClientToServerEvent.CreateGame, gameName);
    }
  }

  return (
    <section className="w-full bg-slate-700 border border-slate-400 p-4 mb-4 flex justify-between pointer-events-auto">
      <div className="flex">
        <form className="flex mr-2" onSubmit={createGame}>
          <input
            className="bg-slate-700 border border-slate-400 h-10 p-4"
            type="text"
            name="game name"
            placeholder="Game name..."
            onChange={(e) => setGameName(e.target.value)}
            value={gameName}
          />
          <ButtonBasic
            buttonType="submit"
            extraStyles="border-l-0 text-yellow-400"
          >
            Create Game
          </ButtonBasic>
        </form>
      </div>
      <div className="border border-slate-400 rounded-full h-10 w-10 flex justify-center items-center">
        <span className="text-lg font-bold">{firstLetterOfUsername}</span>
      </div>
    </section>
  );
}
