import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { AdventuringParty, ClientToServerEvent, DungeonRoomType } from "@speed-dungeon/common";
import React, { MouseEventHandler } from "react";

interface Props {
  party: AdventuringParty;
}

export default function ReadyUpDisplay({ party }: Props) {
  const username = useGameStore().username;
  if (username === null) return <div>no username</div>;
  const socketOption = useWebsocketStore().socketOption;

  function handleExploreClick() {
    socketOption?.emit(ClientToServerEvent.ToggleReadyToExplore);
  }
  function handleDescendClick() {
    socketOption?.emit(ClientToServerEvent.ToggleReadyToDescend);
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

  return (
    <div className="max-w-fit" id="ready-to-explore-display">
      <div
        className="border border-slate-400 bg-slate-700 h-10 
                            pr-2 pl-2 mr-4 mb-1 pointer-events-auto flex 
                            items-center max-w-fit"
      >
        {exploreButtonsText}
      </div>
      <ul className="flex mb-2">{readyToExploreButtons}</ul>
      {party.currentRoom.roomType === DungeonRoomType.Staircase && (
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
