import React from "react";
import { useGameStore } from "@/stores/game-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import TurnOrderBar from "./TurnOrderBar";
import RoomExplorationTracker from "./RoomExplorationTracker";
import { formatDungeonRoomType } from "@speed-dungeon/common";
import getGameAndParty from "@/utils/getGameAndParty";

export default function TopInfoBar() {
  const gameOption = useGameStore().game;
  const username = useGameStore().username;
  const result = getGameAndParty(gameOption, username);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;

  const battleOptionResult = getCurrentBattleOption(game, party.name);

  return (
    <div className="h-10 w-full border-b border-slate-400 bg-slate-700 flex justify-center pointer-events-auto relative">
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
    </div>
  );
}
