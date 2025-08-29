import {
  AffixType,
  CombatAttribute,
  CombatantEquipment,
  ConsumableType,
  EquipmentType,
  Inventory,
  OneHandedMeleeWeapon,
  SuffixType,
  TwoHandedRangedWeapon,
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
  for (let i = 0; i < 2; i += 1) {
    const skillbook = createConsumableByType(ConsumableType.RogueSkillbook);
    skillbook.itemLevel = 3;
    inventory.consumables.push(skillbook);
  }

  const tradeableItemResult = generateSpecificEquipmentType({
    equipmentType: EquipmentType.OneHandedMeleeWeapon,
    baseItemType: OneHandedMeleeWeapon.YewWand,
  });
  if (tradeableItemResult instanceof Error) return;
  tradeableItemResult.durability = { current: 0, inherentMax: 6 };

  tradeableItemResult.affixes[AffixType.Suffix][SuffixType.Strength] = {
    combatAttributes: { [CombatAttribute.Strength]: 1 },
    equipmentTraits: {},
    tier: 1,
  };

  inventory.equipment.push(tradeableItemResult);

  const tradeableItemResult2 = generateSpecificEquipmentType({
    equipmentType: EquipmentType.TwoHandedRangedWeapon,
    baseItemType: TwoHandedRangedWeapon.EtherBow,
  });
  if (tradeableItemResult2 instanceof Error) return;
  tradeableItemResult2.durability = { current: 0, inherentMax: 6 };

  tradeableItemResult2.affixes[AffixType.Suffix][SuffixType.Dexterity] = {
    combatAttributes: { [CombatAttribute.Evasion]: 1 },
    equipmentTraits: {},
    tier: 1,
  };

  inventory.equipment.push(tradeableItemResult2);
}
