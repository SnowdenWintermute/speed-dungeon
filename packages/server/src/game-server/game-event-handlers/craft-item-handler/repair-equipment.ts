import { ERROR_MESSAGES, Equipment } from "@speed-dungeon/common";

export function repairEquipment(equipment: Equipment) {
  if (equipment.durability === null || equipment.durability.current === equipment.durability.max)
    return new Error(ERROR_MESSAGES.ITEM.IS_FULLY_REPAIRED);

  equipment.durability.current = equipment.durability.max;
}
