import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, Item } from "@speed-dungeon/common";

export default function getItemOnGround(itemId: string): Error | Item {
  const gameState = useGameStore.getState();
  const partyResult = gameState.getParty();
  if (partyResult instanceof Error) return partyResult;
  for (const item of Object.values(partyResult.currentRoom.items)) {
    if (item.entityProperties.id === itemId) return item;
  }

  return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
}
