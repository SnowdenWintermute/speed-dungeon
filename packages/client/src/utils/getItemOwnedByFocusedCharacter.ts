import { GameState } from "@/stores/game-store";
import getFocusedCharacter from "./getFocusedCharacter";
import { ERROR_MESSAGES, Item } from "@speed-dungeon/common";
import Inventory from "@speed-dungeon/common/src/combatants/inventory";

export default function getItemOwnedByFocusedCharacter(
  gameState: GameState,
  username: string | null,
  itemId: string
): Error | Item {
  if (!username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
  return Inventory.getItem(focusedCharacterResult.combatantProperties.inventory, itemId);
}
