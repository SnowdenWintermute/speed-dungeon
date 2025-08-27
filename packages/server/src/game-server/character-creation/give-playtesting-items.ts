import { CombatantEquipment, ConsumableType, Inventory } from "@speed-dungeon/common";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";

export function givePlaytestingItems(combatantEquipment: CombatantEquipment, inventory: Inventory) {
  for (let i = 0; i < 3; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.RogueSkillbook);
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.WarriorSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 2; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.MageSkillbook);
    skillbook.itemLevel = 3;
    inventory.consumables.push(skillbook);
  }
  // const bodyResult = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.BodyArmor,
  //   baseItemType: BodyArmor.Rags,
  // });
  // if (bodyResult instanceof Error) return;
  // bodyResult.durability = { current: 2, inherentMax: 6 };

  // combatantEquipment.wearables[WearableSlotType.Body] = bodyResult;

  // const helmResult = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.HeadGear,
  //   baseItemType: HeadGear.Cap,
  // });
  // if (helmResult instanceof Error) return;
  // helmResult.durability = { current: 1, inherentMax: 3 };

  // combatantEquipment.wearables[WearableSlotType.Head] = helmResult;

  // const ring = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.Ring,
  //   baseItemType: Ring.Ring,
  // });
  // if (ring instanceof Error) return;
  // ring.itemLevel = 10;
  // combatantEquipment.wearables[WearableSlotType.RingL] = ring;

  // const amulet = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.Amulet,
  //   baseItemType: Amulet.Amulet,
  // });
  // if (amulet instanceof Error) return;
  // amulet.itemLevel = 5;
  // combatantEquipment.wearables[WearableSlotType.Amulet] = amulet;
}
