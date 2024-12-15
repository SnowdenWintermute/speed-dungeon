import {
  CombatantClass,
  Equipment,
  EquipmentSlot,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "./generate-test-items.js";

export default function createStartingEquipment(combatantClass: CombatantClass) {
  const startingEquipment: Partial<Record<EquipmentSlot, Equipment>> = {};

  let mainhand: Equipment | Error | undefined, offhand: Equipment | Error | undefined;
  switch (combatantClass) {
    case CombatantClass.Warrior:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.Stick,
        },
        true
      );
      offhand = generateSpecificEquipmentType(
        { equipmentType: EquipmentType.Shield, baseItemType: Shield.PotLid },
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
          baseItemType: OneHandedMeleeWeapon.ButterKnife,
        },
        true
      );
      offhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.RuneSword,
        },
        true
      );
      break;
  }

  if (mainhand instanceof Error) return mainhand;
  if (offhand instanceof Error) return offhand;

  if (mainhand) startingEquipment[EquipmentSlot.MainHand] = mainhand;
  if (offhand) startingEquipment[EquipmentSlot.OffHand] = offhand;

  return startingEquipment;
}
