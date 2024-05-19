import React from "react";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import TurnOrderBar from "./TurnOrderBar";
import RoomExplorationTracker from "./RoomExplorationTracker";
import { formatDungeonRoomType } from "@speed-dungeon/common/src/adventuring_party/dungeon-room";
import getGameAndParty from "@/utils/getGameAndParty";

export default function TopInfoBar() {
  const gameOption = useGameStore().game;
  const usernameOption = useLobbyStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (typeof result === "string") return <div>{result}</div>;
  const [game, party] = result;

  const battleOption = getCurrentBattleOption(game, party.name);

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
      {battleOption ? <TurnOrderBar battle={battleOption} /> : <RoomExplorationTracker />}
    </div>
  );
}
