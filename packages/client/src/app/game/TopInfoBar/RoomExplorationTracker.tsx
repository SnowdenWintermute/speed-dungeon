import { BUTTON_HEIGHT_SMALL, SPACING_REM } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { DUNGEON_ROOM_TYPE_STRINGS } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

export const RoomExplorationTracker = observer(() => {
  const { party } = AppStore.get().gameStore.getFocusedCharacterContext();

  const currentRoom = party.dungeonExplorationManager.getCurrentRoomNumber();
  const roomList = party.dungeonExplorationManager.getClientVisibleRoomExplorationList();

  return (
    <ul className="h-full list-none flex items-center">
      {roomList.map((roomTypeOption, i) => {
        const currentRoomClass =
          currentRoom === i + 1 ? "border border-yellow-400" : "border-slate-400";

        const connectionLine =
          i !== roomList.length - 1 ? (
            <span className={"h-[2px] bg-slate-400"} style={{ width: `${SPACING_REM}rem` }} />
          ) : (
            <></>
          );

        return (
          <li key={i} className="flex items-center">
            <div
              className={`pr-2 pl-2 border text-sm flex items-center justify-center ${currentRoomClass}`}
              style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
            >
              {roomTypeOption === null ? "????" : DUNGEON_ROOM_TYPE_STRINGS[roomTypeOption]}
            </div>
            {connectionLine}
          </li>
        );
      })}
    </ul>
  );
});
