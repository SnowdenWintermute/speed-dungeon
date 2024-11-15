import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import { AdventuringParty, ClientToServerEvent, DungeonRoomType } from "@speed-dungeon/common";
import React, { MouseEventHandler } from "react";
import HotkeyButton from "../components/atoms/HotkeyButton";
import { BaseMenuState } from "./ActionMenu/menu-state/base";

interface Props {
  party: AdventuringParty;
}

export default function ReadyUpDisplay({ party }: Props) {
  const username = useGameStore().username;
  if (username === null) return <div>no username</div>;

  function handleExploreClick() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
  }
  function handleDescendClick() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToDescend);
  }

  const exploreButtonsText =
    party.currentRoom.roomType != DungeonRoomType.Staircase
      ? "Players ready to explore: "
      : "Players voting to stay on current floor: ";

  if (party.battleId !== null) return <></>;

  const readyToExploreButtons = createReadyButtons(
    username,
    handleExploreClick,
    party.playerUsernames,
    party.playersReadyToExplore
  );
  const readyToDescendButtons = createReadyButtons(
    username,
    handleDescendClick,
    party.playerUsernames,
    party.playersReadyToDescend
  );

  const inStaircaseRoom = party.currentRoom.roomType === DungeonRoomType.Staircase;
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const detailedEntity = useGameStore.getState().detailedEntity;
  const hoveredEntity = useGameStore.getState().hoveredEntity;

  const shouldDim = detailedEntity || hoveredEntity;

  return (
    <>
      {!inStaircaseRoom &&
        Object.keys(party.currentRoom.monsters).length === 0 &&
        currentMenu instanceof BaseMenuState && (
          <div
            className="absolute top-1/3 -translate-y-1/2 left-1/2 -translate-x-1/2 border border-slate-400 bg-slate-700 p-4 flex flex-col pointer-events-auto"
            style={{ opacity: shouldDim ? "50%" : "100%" }}
          >
            <h3 className="text-xl mb-2">The room is empty of monsters</h3>
            <div className="flex justify-between">
              <HotkeyButton
                className="h-10 pr-2 pl-2 border border-slate-400 w-full text-center hover:bg-slate-950"
                hotkeys={["KeyG"]}
                onClick={handleExploreClick}
              >
                Explore next room (G)
              </HotkeyButton>
            </div>
          </div>
        )}
      {inStaircaseRoom && (
        <div className="absolute top-1/3 -translate-y-1/2 left-1/2 -translate-x-1/2 border border-slate-400 bg-slate-700 p-4 flex flex-col pointer-events-auto">
          <h3 className="text-xl mb-2">You have found the staircase to the next floor</h3>
          <div className="flex justify-between">
            <HotkeyButton
              className="h-10 pr-2 pl-2 border border-slate-400 w-1/2 text-center hover:bg-slate-950 mr-1"
              hotkeys={["KeyG"]}
              onClick={handleExploreClick}
            >
              Vote to stay (G)
            </HotkeyButton>
            <HotkeyButton
              className="h-10 pr-2 pl-2 border border-slate-400 w-1/2 text-center hover:bg-slate-950 ml-1"
              hotkeys={["KeyH"]}
              onClick={handleDescendClick}
            >
              Vote to descend (H)
            </HotkeyButton>
          </div>
        </div>
      )}
      <div className="max-w-fit" id="ready-to-explore-display">
        <div
          className="border border-slate-400 bg-slate-700 h-10 
                            pr-2 pl-2 mr-4 mb-1 pointer-events-auto flex 
                            items-center max-w-fit"
        >
          {exploreButtonsText}
        </div>
        <ul className="flex mb-2">{readyToExploreButtons}</ul>
        {inStaircaseRoom && (
          <>
            <div
              className="border border-slate-400 bg-slate-700 h-10
                            pr-2 pl-2 mr-4 mb-1 pointer-events-auto flex
                            items-center"
            >
              Players voting to descend deeper into the dungeon:
            </div>
            <ul className="flex">{readyToDescendButtons}</ul>
          </>
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
