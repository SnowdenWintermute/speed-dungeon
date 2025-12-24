import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { AffixCategory, AffixType } from "../../items/equipment/affixes.js";
import { EquipmentTraitType } from "../../items/equipment/equipment-traits/index.js";
import {
  EquipmentBaseItem,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "../../items/equipment/equipment-types/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { ItemGenerator } from "../../items/item-creation/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";

const STARTING_EQUIPMENT_BY_COMBATANT_CLASS: Record<
  CombatantClass,
  Partial<Record<HoldableSlotType, EquipmentBaseItem>>
> = {
  [CombatantClass.Warrior]: {
    [HoldableSlotType.MainHand]: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSword,
    },
    // [HoldableSlotType.MainHand]: {
    //   equipmentType: EquipmentType.OneHandedMeleeWeapon,
    //   baseItemType: OneHandedMeleeWeapon.Dagger,
    // },
    [HoldableSlotType.OffHand]: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Heater,
    },
  },
  [CombatantClass.Mage]: {
    [HoldableSlotType.MainHand]: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.RottingBranch,
    },
  },
  [CombatantClass.Rogue]: {
    // [HoldableSlotType.MainHand]: {
    //   equipmentType: EquipmentType.TwoHandedRangedWeapon,
    //   baseItemType: TwoHandedRangedWeapon.CompositeBow,
    // },
    [HoldableSlotType.MainHand]: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Dagger,
    },
    [HoldableSlotType.OffHand]: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Rapier,
    },
  },
};

export function giveStartingEquipment(
  combatantProperties: CombatantProperties,
  itemGenerator: ItemGenerator
) {
  const combatantClass =
    combatantProperties.classProgressionProperties.getMainClass().combatantClass;
  const startingHoldables = STARTING_EQUIPMENT_BY_COMBATANT_CLASS[combatantClass];

  const mainHoldableHotswapSlot = combatantProperties.equipment.getActiveHoldableSlot();

  for (const [slotType, template] of iterateNumericEnumKeyedRecord(startingHoldables)) {
    const holdable = itemGenerator.generateSpecificEquipmentType(template, {
      noAffixes: true,
    });
    // repairEquipment(holdable); // @TODO - put this back
    mainHoldableHotswapSlot.holdables[slotType] = holdable;

    // holdable.durability!.current = 1; // @TODO - remove (testing)

    if (slotType !== HoldableSlotType.MainHand) continue;

    // @TESTING
    if (holdable.affixes[AffixCategory.Prefix] === undefined) {
      holdable.affixes[AffixCategory.Prefix] = {};
    }

    holdable.affixes[AffixCategory.Prefix][AffixType.LifeSteal] = {
      combatAttributes: {},
      tier: 1,
      equipmentTraits: {
        [EquipmentTraitType.LifeSteal]: {
          equipmentTraitType: EquipmentTraitType.LifeSteal,
          value: 100,
        },
      },
    };
  }
}
