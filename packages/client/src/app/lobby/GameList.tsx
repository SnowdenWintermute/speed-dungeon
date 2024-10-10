import { useLobbyStore } from "@/stores/lobby-store";
import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { ClientToServerEvent, GameListEntry } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function GameList() {
  const gameList = useLobbyStore().gameList;
  return (
    <section
      className="p-4 mr-4 bg-slate-700 border border-slate-400 overflow-y-auto flex-grow relative"
      id="game_list pointer-events-auto"
    >
      <div className="h-[80%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      <h2 className="text-slate-200 text-l mb-2">{"Games"}</h2>
      <ul className="list-none">
        {gameList.map((game) => (
          <GameListItem game={game} key={game.gameName} />
        ))}
      </ul>
    </section>
  );
}

interface GameListItemProps {
  game: GameListEntry;
}

function GameListItem(props: GameListItemProps) {
  function joinGame() {
    websocketConnection.emit(ClientToServerEvent.JoinGame, props.game.gameName);
  }

  return (
    <li className="w-full flex border border-slate-400 mb-4 justify-between pointer-events-auto">
      <div className="flex">
        <div className="h-10 flex items-center w-40 border-r border-slate-400 pl-4">
          <div className="overflow-hidden whitespace-nowrap overflow-ellipsis">
            {props.game.gameName}
          </div>
        </div>
        <div className="h-10 flex items-center w-24 border-r border-slate-400 pl-4">
          <div className="overflow-hidden whitespace-nowrap overflow-ellipsis">
            {"Players:"} {props.game.numberOfUsers}
          </div>
        </div>
      </div>
      <ButtonBasic
        onClick={joinGame}
        disabled={typeof props.game.timeStarted === "number"}
        extraStyles="border-r-0 border-t-0 border-b-0"
      >
        {"Join"}
      </ButtonBasic>
    </li>
  );
}
