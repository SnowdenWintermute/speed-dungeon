import {
  Amulet,
  BodyArmor,
  CombatantEquipment,
  EquipmentType,
  HeadGear,
  Ring,
  WearableSlotType,
} from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "../item-generation/generate-test-items.js";

export function givePlaytestingItems(combatantEquipment: CombatantEquipment) {
  const bodyResult = generateSpecificEquipmentType({
    equipmentType: EquipmentType.BodyArmor,
    baseItemType: BodyArmor.Rags,
  });
  if (bodyResult instanceof Error) return;
  bodyResult.durability = { current: 2, inherentMax: 6 };

  combatantEquipment.wearables[WearableSlotType.Body] = bodyResult;

  const helmResult = generateSpecificEquipmentType({
    equipmentType: EquipmentType.HeadGear,
    baseItemType: HeadGear.Cap,
  });
  if (helmResult instanceof Error) return;
  helmResult.durability = { current: 1, inherentMax: 3 };

  combatantEquipment.wearables[WearableSlotType.Head] = helmResult;

  const ring = generateSpecificEquipmentType({
    equipmentType: EquipmentType.Ring,
    baseItemType: Ring.Ring,
  });
  if (ring instanceof Error) return;
  ring.itemLevel = 10;
  combatantEquipment.wearables[WearableSlotType.RingL] = ring;

  const amulet = generateSpecificEquipmentType({
    equipmentType: EquipmentType.Amulet,
    baseItemType: Amulet.Amulet,
  });
  if (amulet instanceof Error) return;
  amulet.itemLevel = 5;
  combatantEquipment.wearables[WearableSlotType.Amulet] = amulet;
}
