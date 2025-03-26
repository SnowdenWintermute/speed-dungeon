import { Equipment, EquipmentSlotType, TaggedEquipmentSlot } from "@speed-dungeon/common";
import { ModularCharacter } from "@/app/3d-world/combatant-models/modular-character";

export async function equipHoldableModelToModularCharacter(
  modularCharacter: ModularCharacter,
  slot: TaggedEquipmentSlot,
  equipment: Equipment
) {
  if (slot.type !== EquipmentSlotType.Holdable) return;
  else await modularCharacter.equipHoldableModel(equipment, slot.slot);
}
