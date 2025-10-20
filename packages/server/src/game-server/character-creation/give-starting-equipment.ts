import {
  AffixCategory,
  AffixType,
  CombatantClass,
  CombatantProperties,
  EquipmentBaseItem,
  EquipmentSlotType,
  EquipmentTraitType,
  EquipmentType,
  HoldableSlotType,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { repairEquipment } from "../game-event-handlers/craft-item-handler/repair-equipment.js";
import { generateSpecificEquipmentType } from "../item-generation/generate-test-items.js";

const STARTING_EQUIPMENT_BY_COMBATANT_CLASS: Record<
  CombatantClass,
  Partial<Record<HoldableSlotType, EquipmentBaseItem>>
> = {
  [CombatantClass.Warrior]: {
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
      baseItemType: OneHandedMeleeWeapon.Dagger,
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
      baseItemType: OneHandedMeleeWeapon.ButterKnife,
    },
    // [HoldableSlotType.OffHand]: {
    //   equipmentType: EquipmentType.OneHandedMeleeWeapon,
    //   baseItemType: OneHandedMeleeWeapon.ButterKnife,
    // },
  },
};

export function giveStartingEquipment(combatantProperties: CombatantProperties) {
  const combatantClass =
    combatantProperties.classProgressionProperties.getMainClass().combatantClass;
  const startingHoldables = STARTING_EQUIPMENT_BY_COMBATANT_CLASS[combatantClass];

  const mainHoldableHotswapSlot = combatantProperties.equipment.getActiveHoldableSlot();

  for (const [slotType, template] of iterateNumericEnumKeyedRecord(startingHoldables)) {
    const holdable = generateSpecificEquipmentType(template, { noAffixes: true });
    repairEquipment(holdable);
    mainHoldableHotswapSlot.holdables[slotType] = holdable;

    if (slotType !== HoldableSlotType.MainHand) continue;

    // @TESTING
    if (holdable.affixes[AffixCategory.Prefix] === undefined)
      holdable.affixes[AffixCategory.Prefix] = {};
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
    // @TESTING
    giveHotswapSlotEquipment(combatantProperties);
  }
}

function giveHotswapSlotEquipment(combatantProperties: CombatantProperties) {
  const mh = generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.RecurveBow,
    },
    { noAffixes: true }
  );
  combatantProperties.equipment.putEquipmentInSlot(mh, {
    type: EquipmentSlotType.Holdable,
    slot: HoldableSlotType.MainHand,
  });
}
