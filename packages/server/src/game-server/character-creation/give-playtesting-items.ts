import {
  AffixCategory,
  AffixType,
  Amulet,
  CombatAttribute,
  CombatantEquipment,
  ConsumableType,
  EquipmentType,
  Inventory,
  NumberRange,
  OneHandedMeleeWeapon,
  Ring,
  Shield,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";
import {
  generateOneOfEachItem,
  generateSpecificEquipmentType,
} from "../item-generation/generate-test-items.js";

export function givePlaytestingItems(combatantEquipment: CombatantEquipment, inventory: Inventory) {
  inventory.changeShards(20);

  const tradeableItemResult = generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSword,
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

  inventory.equipment.push(
    generateSpecificEquipmentType(
      {
        equipmentType: EquipmentType.Shield,
        baseItemType: Shield.LanternShield,
      },
      { itemLevel: 1 }
    )
  );
  inventory.equipment.push(
    generateSpecificEquipmentType(
      {
        equipmentType: EquipmentType.Ring,
        baseItemType: Ring.Ring,
      },
      { itemLevel: 1 }
    )
  );
  inventory.equipment.push(
    generateSpecificEquipmentType(
      {
        equipmentType: EquipmentType.Amulet,
        baseItemType: Amulet.Amulet,
      },
      { itemLevel: 1 }
    )
  );

  const item = generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Stick,
    },
    { itemLevel: 1 }
  );

  inventory.insertItem(item);

  // const items = generateOneOfEachItem(new NumberRange(1, 10));
  // for (const item of items) inventory.insertItem(item);
}

function givePlaytestingSkillbooks(inventory: Inventory) {
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
}
