import { ClientToServerEvent, GameMode } from "@speed-dungeon/common";
import React, { FormEvent, useState } from "react";
import TextInput from "@/app/components/atoms/TextInput";
import { websocketConnection } from "@/singletons/websocket-connection";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";

export default function HostGameForm() {
  const [selectedGameMode, setSelectedGameMode] = useState(GameMode.Progression);
  const [gameName, setGameName] = useState("");
  const [gamePassword, setGamePassword] = useState("");

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    websocketConnection.emit(ClientToServerEvent.CreateGame, gameName);
  }

  return (
    <form
      id="create-game-form"
      className="w-full p-4 border border-t-0 border-slate-400 bg-slate-700"
      onSubmit={createGame}
    >
      <div className="flex flex-1 flex-col mb-2">
        <div className="flex mb-2">
          <TextInput
            className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1 mr-1"
            type="text"
            name="game name"
            placeholder="Game name..."
            changeHandler={(e) => setGameName(e.target.value)}
            value={gameName}
            autoComplete="new-password"
          />
          <TextInput
            className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1 ml-1"
            type="password"
            name="password"
            placeholder="Password..."
            changeHandler={(e) => setGamePassword(e.target.value)}
            value={gamePassword}
            autoComplete="new-password"
          />
        </div>
        <div className="flex items-center mb-2">Game mode:</div>
        <div className="flex mb-2">
          <button
            type="button"
            onClick={() => {
              setSelectedGameMode(GameMode.Race);
            }}
            className={`flex-1 h-10 border border-slate-400 
                        ${selectedGameMode === GameMode.Race ? "bg-slate-950" : "bg-slate-700"}
                        mr-1
                        `}
          >
            RACE
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedGameMode(GameMode.Progression);
            }}
            className={`flex-1 h-10 border border-slate-400
                        ${selectedGameMode === GameMode.Progression ? "bg-slate-950" : "bg-slate-700"}
                        ml-1
                        `}
          >
            PROGRESSION
          </button>
        </div>
        <ButtonBasic buttonType="submit" extraStyles="bg-slate-700">
          CREATE
        </ButtonBasic>
      </div>
    </form>
  );
}
