import { Equipment } from "@speed-dungeon/common";

export function repairEquipment(equipment: Equipment) {
  if (equipment.durability !== null) equipment.durability.current = equipment.durability.max;
}
