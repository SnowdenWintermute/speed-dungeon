import React from "react";
import { useGameStore } from "@/stores/game-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import TurnOrderBar from "./TurnOrderBar";
import RoomExplorationTracker from "./RoomExplorationTracker";
import { ClientToServerEvent, formatDungeonRoomType } from "@speed-dungeon/common";
import getGameAndParty from "@/utils/getGameAndParty";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function TopInfoBar() {
  const gameOption = useGameStore().game;
  const username = useGameStore().username;
  const result = getGameAndParty(gameOption, username);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;

  const battleOptionResult = getCurrentBattleOption(game, party.name);

  return (
    <div className="h-10 w-full border-b border-slate-400 bg-slate-700 flex justify-center items-center pointer-events-auto relative">
      <div className="p-2 absolute left-0">
        {"Floor "}
        {party.currentFloor}
        {", room "}
        {party.roomsExplored.onCurrentFloor}
        {": "}
        {formatDungeonRoomType(party.currentRoom.roomType)}
      </div>
      {!(battleOptionResult instanceof Error) && battleOptionResult !== null ? (
        <TurnOrderBar battle={battleOptionResult} />
      ) : (
        <RoomExplorationTracker />
      )}
      <div className="absolute right-2 pr-2 pl-2 border border-slate-400">
        <button onClick={() => websocketConnection.emit(ClientToServerEvent.LeaveGame)}>
          LEAVE GAME{" "}
        </button>
      </div>
    </div>
  );
}
