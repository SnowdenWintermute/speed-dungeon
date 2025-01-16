import { ERROR_MESSAGES, Equipment } from "@speed-dungeon/common";

export function repairEquipment(equipment: Equipment) {
  const durability = Equipment.getDurability(equipment);
  if (durability === null || durability.current === durability.max || equipment.durability === null)
    return new Error(ERROR_MESSAGES.ITEM.IS_FULLY_REPAIRED);

  equipment.durability.current = durability.max;
}
