import React from "react";
import { useGameStore } from "@/stores/game-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import RoomExplorationTracker from "./RoomExplorationTracker";
import {
  AdventuringParty,
  ClientToServerEvent,
  DUNGEON_ROOM_TYPE_STRINGS,
} from "@speed-dungeon/common";
import getGameAndParty from "@/utils/getGameAndParty";
import { websocketConnection } from "@/singletons/websocket-connection";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { ZIndexLayers } from "@/app/z-index-layers";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import TurnOrderPredictionBar from "./turn-order-prediction-bar";

import StairsIcon from "../../../../public/img/game-ui-icons/stairs.svg";
import DoorIcon from "../../../../public/img/game-ui-icons/door-icon.svg";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import getParty from "@/utils/getParty";

export default function TopInfoBar() {
  const mutateGameState = useGameStore().mutateState;
  const viewingLeaveGameModal = useGameStore((state) => state.viewingLeaveGameModal);
  const gameOption = useGameStore().game;
  const username = useGameStore().username;
  const result = getGameAndParty(gameOption, username);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;

  const battleOptionResult = getCurrentBattleOption(game, party.name);

  function leaveGame() {
    mutateGameState((state) => {
      console.log("null game");
      const partyResult = getParty(state.game, state.username);
      console.log("party result:", partyResult);
      if (!(partyResult instanceof Error)) {
        console.log("cleaning action entities on null game");
        console.log(JSON.stringify(partyResult.actionEntities));
        for (const [entityId, entity] of Object.entries(partyResult.actionEntities)) {
          AdventuringParty.unregisterActionEntity(partyResult, entity.entityProperties.id, null);
          getGameWorld().actionEntityManager.unregister(entity.entityProperties.id);
        }
      }

      state.viewingLeaveGameModal = false;
      state.game = null;
    });

    websocketConnection.emit(ClientToServerEvent.LeaveGame);

    getGameWorld().replayTreeManager.clear();
    getGameWorld().modelManager.modelActionQueue.clear();

    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
    });
  }

  return (
    <div className="h-10 w-full border-b border-slate-400 bg-slate-700 flex justify-center items-center pointer-events-auto relative">
      <div className="p-2 absolute left-0 flex items-center text-md">
        <HoverableTooltipWrapper tooltipText="Current floor">
          <div className="h-5 my-1 mr-1">
            <StairsIcon className="fill-slate-400 h-full" />
          </div>
        </HoverableTooltipWrapper>
        <span className="mr-2">{party.currentFloor}</span>

        <HoverableTooltipWrapper tooltipText="Current room">
          <div className="h-5 my-1 mr-1">
            <DoorIcon className="fill-slate-400 h-full" />
          </div>
        </HoverableTooltipWrapper>
        {party.roomsExplored.onCurrentFloor}
        {": "}
        {DUNGEON_ROOM_TYPE_STRINGS[party.currentRoom.roomType]}
      </div>
      {!(battleOptionResult instanceof Error) && battleOptionResult !== null ? (
        <TurnOrderPredictionBar trackers={battleOptionResult.turnOrderManager.turnTrackers} />
      ) : (
        <RoomExplorationTracker />
      )}
      <div className="absolute right-0 h-full w-fit border-l border-slate-400 flex items-center justify-center">
        <HotkeyButton
          className="h-full w-full bg-slate-700 hover:bg-slate-950 pr-4 pl-4 "
          onClick={() => {
            mutateGameState((state) => {
              state.viewingLeaveGameModal = !state.viewingLeaveGameModal;
              state.stackedMenuStates = [];
              state.baseMenuState.inCombat = false;
            });
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
              onClick={() =>
                mutateGameState((state) => {
                  state.viewingLeaveGameModal = false;
                })
              }
              className="h-10 w-24 p-2 border border-slate-400 mr-1 bg-slate-700"
            >
              No
            </HotkeyButton>
            <HotkeyButton
              onClick={leaveGame}
              className="h-10 w-24 p-2 border border-slate-400 ml-1"
            >
              Yes
            </HotkeyButton>
          </div>
        </div>
      )}
    </div>
  );
}
