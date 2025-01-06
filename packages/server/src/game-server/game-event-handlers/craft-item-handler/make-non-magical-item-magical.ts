import { ERROR_MESSAGES, Equipment } from "@speed-dungeon/common";
import { giveNewRandomAffixes } from "./give-new-random-affixes.js";

export function makeNonMagicalItemMagical(equipment: Equipment, itemLevelLimiter: number) {
  if (Equipment.isMagical(equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  return giveNewRandomAffixes(equipment, itemLevelLimiter);
}
