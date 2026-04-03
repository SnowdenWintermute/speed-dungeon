import {
  AffixType,
  CombatantProperties,
  CombatAttribute,
  EquipmentTraitType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedRangedWeapon,
} from "../index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";

// const LIFESTEAL_PREFIX = {
//   combatAttributes: {},
//   tier: 1,
//   equipmentTraits: {
//     [EquipmentTraitType.LifeSteal]: {
//       equipmentTraitType: EquipmentTraitType.LifeSteal,
//       value: 100,
//     },
//   },
// } as const;

export function givePlaytestingItems(
  combatantProperties: CombatantProperties,
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) {
  const { inventory } = combatantProperties;
  inventory.changeShards(20);

  const tradeableItem = itemBuilder
    .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword)
    .durability(0)
    .suffix(AffixType.Strength, {
      combatAttributes: { [CombatAttribute.Strength]: 1 },
      equipmentTraits: {},
      tier: 1,
    })
    .build(idGenerator);

  inventory.equipment.push(tradeableItem);

  inventory.equipment.push(itemBuilder.shield(Shield.LanternShield).build(idGenerator));
  inventory.equipment.push(
    itemBuilder
      .twoHandedRangedWeapon(TwoHandedRangedWeapon.ShortBow)
      // .prefix(AffixType.LifeSteal, LIFESTEAL_PREFIX)
      .build(idGenerator)
  );
  inventory.equipment.push(itemBuilder.ring().randomizeAffixes().build(idGenerator));
  inventory.equipment.push(itemBuilder.amulet().randomizeAffixes().build(idGenerator));

  const item = itemBuilder.oneHandedMeleeWeapon(OneHandedMeleeWeapon.Stick).build(idGenerator);
  inventory.insertItem(item);

  // @TESTING
  giveHotswapSlotEquipment(combatantProperties, idGenerator, itemBuilder);
}

function giveHotswapSlotEquipment(
  combatantProperties: CombatantProperties,
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) {
  const mh = itemBuilder
    .twoHandedRangedWeapon(TwoHandedRangedWeapon.ShortBow)
    .durability(100)
    .build(idGenerator);

  combatantProperties.inventory.insertItem(mh);
  combatantProperties.equipment.changeSelectedHotswapSlot(1);
  combatantProperties.equipment.equipItem(mh.entityProperties.id, false);
}
