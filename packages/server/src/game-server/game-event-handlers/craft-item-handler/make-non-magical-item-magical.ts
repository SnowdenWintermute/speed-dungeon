import {
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CraftingAction,
  ERROR_MESSAGES,
  Equipment,
} from "@speed-dungeon/common";
import { giveNewRandomAffixes } from "./give-new-random-affixes.js";

export function makeNonMagicalItemMagical(equipment: Equipment, itemLevelLimiter: number) {
  const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Imbue];
  if (shouldBeDisabled(equipment, itemLevelLimiter))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  return giveNewRandomAffixes(equipment, itemLevelLimiter);
}
