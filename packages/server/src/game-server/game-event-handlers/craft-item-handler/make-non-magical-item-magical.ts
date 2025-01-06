import { ERROR_MESSAGES, Equipment } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons";

export function makeNonMagicalItemMagical(equipment: Equipment) {
  if (Equipment.isMagical(equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  const gameServer = getGameServer();
  // roll affixes
  const builder = gameServer.itemGenerationBuilders[equipment.equipmentBaseItemProperties.type];
  // const affixes = builder.buildAffixes(equipment.itemLevel);
  // Refactor needed:
  // - separate affix selection from rolling in the builder
  // - adjust item generation directors use the newly separate steps

  const affixes = gameServer.itemGenerationBuilders[equipment.equipmentBaseItemProperties.type];
}
