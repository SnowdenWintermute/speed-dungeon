import { GameState } from "@/stores/game-store";
import getFocusedCharacter from "./getFocusedCharacter";
import { Item } from "@speed-dungeon/common";
import Inventory from "@speed-dungeon/common/src/combatants/inventory";

export default function getItemOwnedByFocusedCharacter(
  gameState: GameState,
  itemId: string
): Error | Item {
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
  return Inventory.getItem(focusedCharacterResult.combatantProperties.inventory, itemId);
}
