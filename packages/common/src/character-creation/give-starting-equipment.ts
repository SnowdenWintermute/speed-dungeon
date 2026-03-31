import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { AffixType } from "../items/equipment/affixes.js";
import { EquipmentTraitType } from "../items/equipment/equipment-traits/index.js";
import { TwoHandedMeleeWeapon } from "../items/equipment/equipment-types/two-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../items/equipment/equipment-types/two-handed-ranged-weapon.js";
import { HoldableSlotType } from "../items/equipment/slots.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { EquipmentBuilder } from "../items/item-creation/item-builder/equipment-builder.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";

const LIFESTEAL_PREFIX = {
  combatAttributes: {},
  tier: 1,
  equipmentTraits: {
    [EquipmentTraitType.LifeSteal]: {
      equipmentTraitType: EquipmentTraitType.LifeSteal,
      value: 100,
    },
  },
} as const;

function getStartingEquipment(
  itemBuilder: ItemBuilder
): Record<CombatantClass, Partial<Record<HoldableSlotType, EquipmentBuilder>>> {
  return {
    [CombatantClass.Warrior]: {
      [HoldableSlotType.MainHand]: itemBuilder
        .twoHandedRangedWeapon(TwoHandedRangedWeapon.CompositeBow)
        .prefix(AffixType.LifeSteal, LIFESTEAL_PREFIX),
    },
    [CombatantClass.Mage]: {
      [HoldableSlotType.MainHand]: itemBuilder
        .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.RottingBranch)
        .prefix(AffixType.LifeSteal, LIFESTEAL_PREFIX),
    },
    [CombatantClass.Rogue]: {
      [HoldableSlotType.MainHand]: itemBuilder
        .twoHandedRangedWeapon(TwoHandedRangedWeapon.ShortBow)
        .prefix(AffixType.LifeSteal, LIFESTEAL_PREFIX),
    },
  };
}

export function giveStartingEquipment(
  combatantProperties: CombatantProperties,
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) {
  const combatantClass =
    combatantProperties.classProgressionProperties.getMainClass().combatantClass;
  const startingHoldables = getStartingEquipment(itemBuilder)[combatantClass];

  const mainHoldableHotswapSlot = combatantProperties.equipment.getActiveHoldableSlot();

  for (const [slotType, builder] of iterateNumericEnumKeyedRecord(startingHoldables)) {
    const holdable = builder.build(idGenerator);
    mainHoldableHotswapSlot.holdables[slotType] = holdable;
  }
}
