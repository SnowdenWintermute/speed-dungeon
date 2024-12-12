import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { AdventuringParty, ERROR_MESSAGES } from "@speed-dungeon/common";
import React from "react";
import ItemOnGround from "./ItemOnGround";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";

interface Props {
  party: AdventuringParty;
  maxHeightRem: number;
}

export default function ItemsOnGround({ party, maxHeightRem }: Props) {
  const username = useGameStore().username;
  const mutateGameState = useGameStore().mutateState;
  if (username === null) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const focusedCharacterId = useGameStore().focusedCharacterId;
  const itemsToDisplay = party.currentRoom.items;
  const showItemsOnGround = useGameStore().showItemsOnGround;

  const playerOwnsCharacter = clientUserControlsCombatant(focusedCharacterId);

  if (itemsToDisplay.length < 1) return <></>;

  return (
    <div
      className="w-full border bg-slate-700 p-2 pointer-events-auto flex flex-col h-fit"
      style={{ maxHeight: `${maxHeightRem}rem` }}
    >
      <div className="flex justify-between">
        <span>{"Items on the ground"}</span>
        <HotkeyButton
          onClick={() => {
            mutateGameState((state) => {
              state.showItemsOnGround = !state.showItemsOnGround;
            });
          }}
        >
          {showItemsOnGround ? "Hide" : "Show"}
        </HotkeyButton>
      </div>
      <Divider />
      {showItemsOnGround && (
        <ul className="list-none flex-grow overflow-y-auto">
          {itemsToDisplay.map((item) => (
            <ItemOnGround
              key={item.entityProperties.id}
              item={item}
              disabled={!playerOwnsCharacter}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
