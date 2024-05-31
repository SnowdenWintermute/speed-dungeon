import { BUTTON_HEIGHT_SMALL, SPACING_REM } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getParty from "@/utils/getParty";
import { formatDungeonRoomType } from "@speed-dungeon/common/src/adventuring_party/dungeon-room";
import React from "react";

export default function RoomExplorationTracker() {
  const game = useGameStore().game;
  const username = useGameStore().username;
  if (!game || !username) return <div>Client error</div>;
  const partyResult = getParty(game, username);
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const party = partyResult;

  return (
    <ul className="h-full list-none flex items-center">
      {party.clientCurrentFloorRoomsList.map((roomTypeOption, i) => {
        const currentRoomClass =
          party.roomsExplored.onCurrentFloor === i + 1
            ? "border border-yellow-400"
            : "border-slate-400";

        const connectionLine =
          i !== party.clientCurrentFloorRoomsList.length - 1 ? (
            <span className={"h-[2px] bg-slate-400"} style={{ width: `${SPACING_REM}rem` }} />
          ) : (
            <></>
          );

        return (
          <>
            <li
              className={`pr-2 pl-2 border text-sm flex items-center justify-center ${currentRoomClass}`}
              style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
            >
              {roomTypeOption === null ? "?" : formatDungeonRoomType(roomTypeOption)}
            </li>
            {connectionLine}
          </>
        );
      })}
    </ul>
  );
}
