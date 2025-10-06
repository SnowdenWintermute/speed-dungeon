import { websocketConnection } from "@/singletons/websocket-connection";
import { getCurrentMenu, operateVendingMachineMenuState, useGameStore } from "@/stores/game-store";
import {
  AdventuringParty,
  ClientToServerEvent,
  DungeonRoomType,
  ExplorationAction,
} from "@speed-dungeon/common";
import React, { MouseEventHandler } from "react";
import HotkeyButton from "../components/atoms/HotkeyButton";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { shouldShowCharacterSheet } from "@/utils/should-show-character-sheet";
import { MenuStateType } from "./ActionMenu/menu-state";
import { playerIsOperatingVendingMachine } from "@/utils/player-is-operating-vending-machine";

interface Props {
  party: AdventuringParty;
}

export default function ReadyUpDisplay({ party }: Props) {
  const username = useGameStore().username;
  if (username === null) return <div>no username</div>;
  const mutateGameState = useGameStore().mutateState;
  const focusedCharacterId = useGameStore().focusedCharacterId;

  function handleExploreClick() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates = [];
    });
  }
  function handleDescendClick() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToDescend);
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates = [];
    });
  }

  const exploreButtonsText =
    party.currentRoom.roomType != DungeonRoomType.Staircase
      ? "Players ready to explore: "
      : "Players voting to stay on current floor: ";

  if (party.battleId !== null) return <></>;

  const { dungeonExplorationManager } = party;

  const playersReadyToExplore = dungeonExplorationManager.getPlayersChoosingAction(
    ExplorationAction.Explore
  );
  const playersReadyToDescend = dungeonExplorationManager.getPlayersChoosingAction(
    ExplorationAction.Descend
  );

  const readyToExploreButtons = createReadyButtons(
    username,
    handleExploreClick,
    party.playerUsernames,
    playersReadyToExplore
  );
  const readyToDescendButtons = createReadyButtons(
    username,
    handleDescendClick,
    party.playerUsernames,
    playersReadyToDescend
  );

  const inStaircaseRoom = party.currentRoom.roomType === DungeonRoomType.Staircase;
  const isVendingMachine = party.currentRoom.roomType === DungeonRoomType.VendingMachine;
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const detailedEntity = useGameStore.getState().detailedEntity;
  const hoveredEntity = useGameStore.getState().hoveredEntity;

  const shouldDim =
    detailedEntity ||
    hoveredEntity ||
    shouldShowCharacterSheet(currentMenu.type) ||
    currentMenu.type !== MenuStateType.Base;
  const descendHotkey = HOTKEYS.SIDE_2;
  const exploreHotkey = HOTKEYS.SIDE_1;
  const operateVendingMachineHotkey = HOTKEYS.SIDE_2;

  return (
    <>
      {!inStaircaseRoom && party.currentRoom.monsterPositions.length === 0 && (
        <div
          className="absolute top-12 -translate-y-[1px] min-w-[500px] text-center left-1/2 -translate-x-1/2 border border-slate-400 bg-slate-700 p-4 flex flex-col pointer-events-auto"
          style={{ opacity: shouldDim ? "0%" : "100%" }}
        >
          {isVendingMachine ? (
            <h3 className="text-xl mb-2">There is a strange device here...</h3>
          ) : (
            <h3 className="text-xl mb-2">The room is empty of monsters</h3>
          )}
          <div className="flex justify-between w-full">
            <HotkeyButton
              className={`h-10 pr-2 pl-2 ${!isVendingMachine ? "bg-slate-800 w-full" : "w-1/2 mr-1 "} border border-white text-center hover:bg-slate-950`}
              hotkeys={["KeyG"]}
              disabled={playerIsOperatingVendingMachine(currentMenu.type)}
              onClick={handleExploreClick}
            >
              Explore next room (G)
            </HotkeyButton>
            {party.currentRoom.roomType === DungeonRoomType.VendingMachine && (
              <HotkeyButton
                className={`h-10 pr-2 pl-2 bg-slate-800 ml-1 w-1/2 border border-white text-center hover:bg-slate-950 disabled:opacity-50`}
                hotkeys={["KeyT"]}
                disabled={
                  !AdventuringParty.playerOwnsCharacter(party, username, focusedCharacterId) ||
                  (currentMenu.type !== MenuStateType.Base &&
                    currentMenu.type !== MenuStateType.OperatingVendingMachine)
                }
                onClick={() => {
                  mutateGameState((state) => {
                    const currentMenu = getCurrentMenu(state);
                    if (currentMenu.type === MenuStateType.OperatingVendingMachine)
                      state.stackedMenuStates.pop();
                    else {
                      state.stackedMenuStates.push(operateVendingMachineMenuState);
                      state.detailedEntity = null;
                      state.hoveredAction = null;
                    }
                  });
                }}
              >
                Operate machine ({letterFromKeyCode(operateVendingMachineHotkey)})
              </HotkeyButton>
            )}
          </div>
        </div>
      )}
      {inStaircaseRoom && (
        <div className="absolute top-10 -translate-y-[1px] left-1/2 -translate-x-1/2 border border-t-0 border-slate-400 bg-slate-700 p-4 flex flex-col pointer-events-auto">
          <h3 className="text-xl mb-2">You have found the staircase to the next floor</h3>
          <div className="flex justify-between">
            <HotkeyButton
              className="h-10 pr-2 pl-2 border border-slate-400 w-1/2 text-center hover:bg-slate-950 mr-1"
              hotkeys={[exploreHotkey]}
              onClick={handleExploreClick}
            >
              Vote to stay ({letterFromKeyCode(exploreHotkey)})
            </HotkeyButton>
            <HotkeyButton
              className="h-10 pr-2 pl-2 border border-slate-400 w-1/2 text-center hover:bg-slate-950 ml-1"
              hotkeys={[descendHotkey]}
              onClick={handleDescendClick}
            >
              Vote to descend ({letterFromKeyCode(descendHotkey)})
            </HotkeyButton>
          </div>
        </div>
      )}

      <div className="w-full flex justify-between" id="ready-to-explore-display">
        <div className="flex flex-col">
          <button
            onClick={handleExploreClick}
            className="border border-slate-400 bg-slate-700 h-10 
                            pr-2 pl-2 mr-4 mb-1 pointer-events-auto flex 
                            items-center max-w-fit"
          >
            {exploreButtonsText}
          </button>
          <ul className="flex flex-col mb-2">{readyToExploreButtons}</ul>
        </div>
        {inStaircaseRoom && (
          <div className="flex flex-col">
            <button
              onClick={handleDescendClick}
              className="border border-slate-400 bg-slate-700 h-10
                            pr-2 pl-2 mr-4 mb-1 pointer-events-auto flex
                            items-center"
            >
              Players voting to descend deeper into the dungeon:
            </button>
            <ul className="flex">{readyToDescendButtons}</ul>
          </div>
        )}
      </div>
    </>
  );
}

function createReadyButtons(
  username: string,
  clickHandler: MouseEventHandler<HTMLButtonElement>,
  usernames: string[],
  listOfReadyUsers: string[]
) {
  return usernames.map((item) => {
    const isReady = listOfReadyUsers.includes(item);
    const isPlayerOfThisClient = username == item;
    const conditionalClasses = isReady ? "" : "opacity-50";
    const handleClick = isPlayerOfThisClient ? clickHandler : () => {};

    return (
      <li key={item} className="mr-2 last:mr-0">
        <button
          onClick={handleClick}
          className={`border border-slate-400 bg-slate-700 h-10 pr-2 pl-2 ${conditionalClasses} pointer-events-auto`}
        >
          {item}
        </button>
      </li>
    );
  });
}
