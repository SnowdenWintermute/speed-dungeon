import React from "react";
import { RoomExplorationTracker } from "./RoomExplorationTracker";
import { DUNGEON_ROOM_TYPE_STRINGS } from "@speed-dungeon/common";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ZIndexLayers } from "@/app/z-index-layers";
import { TurnOrderPredictionBar } from "./turn-order-prediction-bar";
import StairsIcon from "../../../../public/img/game-ui-icons/stairs.svg";
import DoorIcon from "../../../../public/img/game-ui-icons/door-icon.svg";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { DialogElementName } from "@/client-application/ui/dialogs";

export const TopInfoBar = observer(() => {
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore, actionMenu, gameClientRef } = clientApplication;
  const { dialogs } = uiStore;
  const { game, party } = combatantFocus.requireFocusedCharacterContext();

  const battleOption = party.getBattleOption(game);
  const viewingLeaveGameModal = dialogs.isOpen(DialogElementName.LeaveGame);

  const currentFloor = party.dungeonExplorationManager.getCurrentFloor();
  const currentRoom = party.dungeonExplorationManager.getCurrentRoomNumber();

  return (
    <div className="h-10 w-full border-b border-slate-400 bg-slate-700 flex justify-center items-center pointer-events-auto relative">
      <div className="p-2 absolute left-0 flex items-center text-md">
        <HoverableTooltipWrapper tooltipText="Current floor">
          <div className="h-5 my-1 mr-1">
            <StairsIcon className="fill-slate-400 h-full" />
          </div>
        </HoverableTooltipWrapper>
        <span className="mr-2">{currentFloor}</span>

        <HoverableTooltipWrapper tooltipText="Current room">
          <div className="h-5 my-1 mr-1">
            <DoorIcon className="fill-slate-400 h-full" />
          </div>
        </HoverableTooltipWrapper>
        {currentRoom}
        {": "}
        {DUNGEON_ROOM_TYPE_STRINGS[party.currentRoom.roomType]}
      </div>
      {battleOption !== null ? (
        <TurnOrderPredictionBar trackers={battleOption.turnOrderManager.getTrackers()} />
      ) : (
        <RoomExplorationTracker />
      )}
      <div className="absolute right-0 h-full w-fit border-l border-slate-400 flex items-center justify-center">
        <HotkeyButton
          className="h-full w-full bg-slate-700 hover:bg-slate-950 pr-4 pl-4 "
          onClick={() => {
            dialogs.toggle(DialogElementName.LeaveGame);
            actionMenu.clearStack();
          }}
        >
          LEAVE GAME{" "}
        </HotkeyButton>
      </div>
      {viewingLeaveGameModal && (
        <div
          className={`absolute max-w-96 top-24 p-8 border border-slate-400 bg-slate-950 pointer-events-auto`}
          style={{ zIndex: ZIndexLayers.GameModal }}
        >
          <h4 className="text-lg mb-1">Leaving the game...</h4>
          <div className="mb-1">
            <p className="mb-1">
              The last party member leaving the game will result in a wipe if the game is ranked.
            </p>
            <p className="text-red-400">
              Abandoning dead party members will result in their permenant deaths.
            </p>
          </div>
          <p className="mb-2">Really leave this game?</p>
          <div className="flex justify-between">
            <HotkeyButton
              hotkeys={["Escape"]}
              onClick={() => {
                dialogs.close(DialogElementName.LeaveGame);
              }}
              className="h-10 w-24 p-2 border border-slate-400 mr-1 bg-slate-700"
            >
              No
            </HotkeyButton>
            <HotkeyButton
              onClick={() => gameClientRef.get().leaveGame()}
              className="h-10 w-24 p-2 border border-slate-400 ml-1"
            >
              Yes
            </HotkeyButton>
          </div>
        </div>
      )}
    </div>
  );
});
