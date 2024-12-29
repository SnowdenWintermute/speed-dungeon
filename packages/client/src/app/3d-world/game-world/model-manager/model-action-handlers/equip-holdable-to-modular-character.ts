import {
  ERROR_MESSAGES,
  Equipment,
  EquipmentSlotType,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { ModelManager } from "..";

export async function equipHoldableModelToModularCharacter(
  modelManager: ModelManager,
  entityId: string,
  slot: TaggedEquipmentSlot,
  equipment: Equipment
) {
  if (slot.type !== EquipmentSlotType.Holdable) return;
  const modularCharacter = modelManager.combatantModels[entityId];
  if (!modularCharacter) return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
  else await modularCharacter.equipHoldableModel(equipment, slot.slot);
}
