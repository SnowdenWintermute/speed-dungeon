import getFocusedCharacter from "./getFocusedCharacter";
import { ERROR_MESSAGES, Item } from "@speed-dungeon/common";
import { Inventory } from "@speed-dungeon/common";

export default function getItemOwnedByFocusedCharacter(itemId: string): Error | Item {
  const focusedCharacterResult = getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
  const itemInInventoryResult = Inventory.getItem(
    focusedCharacterResult.combatantProperties.inventory,
    itemId
  );
  if (!(itemInInventoryResult instanceof Error)) return itemInInventoryResult;

  for (const item of Object.values(focusedCharacterResult.combatantProperties.equipment)) {
    if (item.entityProperties.id === itemId) return item;
  }
  return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
}
