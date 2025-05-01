import { ModularCharacter } from "@/app/3d-world/scene-entities/character-models";
import { Equipment, EquipmentSlotType, TaggedEquipmentSlot } from "@speed-dungeon/common";

// @TODO - put this on the class?
export async function equipHoldableModelToModularCharacter(
  modularCharacter: ModularCharacter,
  slot: TaggedEquipmentSlot,
  equipment: Equipment
) {
  if (slot.type !== EquipmentSlotType.Holdable) return;
  else await modularCharacter.equipHoldableModel(equipment, slot.slot);
}
