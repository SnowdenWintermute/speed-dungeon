import { ERROR_MESSAGES, Equipment } from "@speed-dungeon/common";

export function makeNonMagicalItemMagical(equipment: Equipment) {
  if (Equipment.isMagical(equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  // roll affixes
}
