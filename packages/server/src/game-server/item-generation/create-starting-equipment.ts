import {
  AffixType,
  CombatAttribute,
  CombatantClass,
  CombatantProperties,
  ERROR_MESSAGES,
  Equipment,
  EquipmentTraitType,
  EquipmentType,
  HoldableSlotType,
  OneHandedMeleeWeapon,
  PrefixType,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "./generate-test-items.js";
import { CombatantEquipment } from "@speed-dungeon/common";

export default function createStartingEquipment(combatantProperties: CombatantProperties) {
  const startingEquipment = new CombatantEquipment();

  let mainhand: Equipment | Error | undefined, offhand: Equipment | Error | undefined;
  switch (combatantProperties.combatantClass) {
    case CombatantClass.Warrior:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.Blade,
        },
        true
      );
      offhand = generateSpecificEquipmentType(
        { equipmentType: EquipmentType.Shield, baseItemType: Shield.TowerShield },
        true
      );
      // startingEquipment[EquipmentSlot.MainHand]
      break;
    case CombatantClass.Mage:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          baseItemType: TwoHandedMeleeWeapon.RottingBranch,
        },
        true
      );
      break;
    case CombatantClass.Rogue:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.WarHammer,
        },
        true
      );
      offhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.WarHammer,
        },
        true
      );
      break;
  }

  if (mainhand instanceof Error) return mainhand;
  if (offhand instanceof Error) return offhand;

  mainhand.affixes[AffixType.Prefix][PrefixType.Mp] = {
    combatAttributes: { [CombatAttribute.Mp]: 10 },
    equipmentTraits: {},
    tier: 0,
  };

  const mainHoldableHotswapSlot = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!mainHoldableHotswapSlot) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);

  if (mainhand) mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = mainhand;
  if (offhand) mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = offhand;

  const holsteredSlot = combatantProperties.equipment.inherentHoldableHotswapSlots[1];
  let mh, oh;
  if (holsteredSlot) {
    switch (combatantProperties.combatantClass) {
      case CombatantClass.Warrior:
        mh = generateSpecificEquipmentType({
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.YewWand,
        });
        oh = generateSpecificEquipmentType({
          equipmentType: EquipmentType.Shield,
          baseItemType: Shield.GothicShield,
        });
        break;
      case CombatantClass.Mage:
        mh = generateSpecificEquipmentType({
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.IceBlade,
        });
        oh = generateSpecificEquipmentType({
          equipmentType: EquipmentType.Shield,
          baseItemType: Shield.AncientBuckler,
        });
        break;
      case CombatantClass.Rogue:
      case CombatantClass.Mage:
        mh = generateSpecificEquipmentType({
          equipmentType: EquipmentType.TwoHandedRangedWeapon,
          baseItemType: TwoHandedRangedWeapon.MilitaryBow,
        });
        break;
    }
    if (!(mh instanceof Error)) holsteredSlot.holdables[HoldableSlotType.MainHand] = mh;
    if (oh) {
      if (!(oh instanceof Error)) holsteredSlot.holdables[HoldableSlotType.OffHand] = oh;
    }
  }

  return startingEquipment;
}
