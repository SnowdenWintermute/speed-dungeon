import {
  AffixCategory,
  AffixType,
  CombatAttribute,
  CombatantEquipment,
  ConsumableType,
  Equipment,
  EquipmentType,
  Inventory,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";
import { generateSpecificEquipmentType } from "../item-generation/generate-test-items.js";

export function givePlaytestingItems(combatantEquipment: CombatantEquipment, inventory: Inventory) {
  for (let i = 0; i < 3; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.RogueSkillbook);
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.RogueSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.MageSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.WarriorSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 2; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.RogueSkillbook);
    skillbook.itemLevel = 3;
    inventory.consumables.push(skillbook);
  }

  const tradeableItemResult = generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.RottingBranch,
    },
    {}
  );
  if (tradeableItemResult instanceof Error) return;
  tradeableItemResult.durability = { current: 0, inherentMax: 6 };

  tradeableItemResult.insertOrReplaceAffix(AffixCategory.Suffix, AffixType.Strength, {
    combatAttributes: { [CombatAttribute.Strength]: 1 },
    equipmentTraits: {},
    tier: 1,
  });

  inventory.equipment.push(tradeableItemResult);

  // const items = generateOneOfEachItem(new NumberRange(1, 10));
  // for (const item of items) Inventory.insertItem(inventory, item);
}
