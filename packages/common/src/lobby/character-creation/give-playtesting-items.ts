import {
  AffixCategory,
  AffixType,
  Amulet,
  CombatantProperties,
  CombatAttribute,
  ConsumableType,
  EquipmentType,
  Inventory,
  ItemGenerator,
  OneHandedMeleeWeapon,
  Ring,
  Shield,
  TwoHandedRangedWeapon,
} from "../../index.js";

export function givePlaytestingItems(
  combatantProperties: CombatantProperties,
  itemGenerator: ItemGenerator
) {
  const { inventory } = combatantProperties;
  inventory.changeShards(20);

  const tradeableItemResult = itemGenerator.generateSpecificEquipmentType(
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
    itemGenerator.generateSpecificEquipmentType(
      {
        equipmentType: EquipmentType.Shield,
        baseItemType: Shield.LanternShield,
      },
      { itemLevel: 1 }
    )
  );
  inventory.equipment.push(
    itemGenerator.generateSpecificEquipmentType(
      {
        equipmentType: EquipmentType.Ring,
        baseItemType: Ring.Ring,
      },
      { itemLevel: 1 }
    )
  );
  inventory.equipment.push(
    itemGenerator.generateSpecificEquipmentType(
      {
        equipmentType: EquipmentType.Amulet,
        baseItemType: Amulet.Amulet,
      },
      { itemLevel: 1 }
    )
  );

  const item = itemGenerator.generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Stick,
    },
    { itemLevel: 1 }
  );

  inventory.insertItem(item);

  // const items = generateOneOfEachItem(new NumberRange(1, 10));
  // for (const item of items) inventory.insertItem(item);

  // @TESTING
  giveHotswapSlotEquipment(combatantProperties, itemGenerator);
}

function giveHotswapSlotEquipment(
  combatantProperties: CombatantProperties,
  itemGenerator: ItemGenerator
) {
  const mh = itemGenerator.generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.ShortBow,
    },
    { noAffixes: true }
  );

  mh.durability!.inherentMax = 15;
  mh.changeDurability(100);
  combatantProperties.inventory.insertItem(mh);
  combatantProperties.equipment.changeSelectedHotswapSlot(1);
  combatantProperties.equipment.equipItem(mh.entityProperties.id, false);
}

function givePlaytestingSkillbooks(inventory: Inventory, itemGenerator: ItemGenerator) {
  for (let i = 0; i < 3; i += 1) {
    const skillbook = itemGenerator.createConsumableByType(ConsumableType.RogueSkillbook);
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = itemGenerator.createConsumableByType(ConsumableType.RogueSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = itemGenerator.createConsumableByType(ConsumableType.MageSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 1; i += 1) {
    const skillbook = itemGenerator.createConsumableByType(ConsumableType.WarriorSkillbook);
    skillbook.itemLevel = 2;
    inventory.consumables.push(skillbook);
  }
  for (let i = 0; i < 2; i += 1) {
    const skillbook = itemGenerator.createConsumableByType(ConsumableType.RogueSkillbook);
    skillbook.itemLevel = 3;
    inventory.consumables.push(skillbook);
  }
}
