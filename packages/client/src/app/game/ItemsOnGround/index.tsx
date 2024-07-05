import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { AdventuringParty, ERROR_MESSAGES } from "@speed-dungeon/common";
import React from "react";
import ItemOnGround from "./ItemOnGround";

interface Props {
  party: AdventuringParty;
  maxHeightRem: number;
}

export default function ItemsOnGround({ party, maxHeightRem }: Props) {
  const username = useGameStore().username;
  if (username === null) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const focusedCharacterId = useGameStore().focusedCharacterId;
  const itemsToDisplay = party.currentRoom.items;

  const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
    party,
    username,
    focusedCharacterId
  );

  if (itemsToDisplay.length < 1) return <></>;

  return (
    <div
      className="w-full border border-slate-400 bg-slate-700 p-2 pointer-events-auto flex flex-col h-fit"
      style={{ maxHeight: `${maxHeightRem}rem` }}
    >
      {"Items on the ground"}
      <Divider />
      <ul className="list-none flex-grow overflow-y-auto">
        {itemsToDisplay.map((item) => (
          <ItemOnGround
            key={item.entityProperties.id}
            itemId={item.entityProperties.id}
            name={item.entityProperties.name}
            disabled={!playerOwnsCharacter}
          />
        ))}
      </ul>
    </div>
  );
}
