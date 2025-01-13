import {
  CombatantClass,
  CombatantProperties,
  ERROR_MESSAGES,
  Equipment,
  EquipmentType,
  HoldableSlotType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
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
          baseItemType: OneHandedMeleeWeapon.Dagger,
        },
        true
      );
      break;
  }

  if (mainhand instanceof Error) return mainhand;
  if (offhand instanceof Error) return offhand;

  const mainHoldableHotswapSlot = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!mainHoldableHotswapSlot) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);

  if (mainhand) mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = mainhand;
  if (offhand) mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = offhand;

  return startingEquipment;
}

// function giveTestHolsteredItems(){
// const holsteredSlot = combatantProperties.equipment.inherentHoldableHotswapSlots[1];
// let mh, oh;
// if (holsteredSlot) {
//   switch (combatantProperties.combatantClass) {
//     case CombatantClass.Warrior:
//       mh = generateSpecificEquipmentType({
//         equipmentType: EquipmentType.OneHandedMeleeWeapon,
//         baseItemType: OneHandedMeleeWeapon.Stick,
//       });

//       oh = generateSpecificEquipmentType({
//         equipmentType: EquipmentType.Shield,
//         baseItemType: Shield.KiteShield,
//       });
//       break;
//     case CombatantClass.Mage:
//       mh = generateSpecificEquipmentType({
//         equipmentType: EquipmentType.OneHandedMeleeWeapon,
//         baseItemType: OneHandedMeleeWeapon.MapleWand,
//       });
//       oh = generateSpecificEquipmentType({
//         equipmentType: EquipmentType.Shield,
//         baseItemType: Shield.Heater,
//       });
//       break;
//     case CombatantClass.Rogue:
//     case CombatantClass.Mage:
//       mh = generateSpecificEquipmentType({
//         equipmentType: EquipmentType.TwoHandedRangedWeapon,
//         baseItemType: TwoHandedRangedWeapon.ShortBow,
//       });
//       break;
//   }
//   if (!(mh instanceof Error)) {
//     mh.entityProperties.name = "some long ass name that is really freakin long";
//     holsteredSlot.holdables[HoldableSlotType.MainHand] = mh;
//   }
//   if (oh) {
//     if (!(oh instanceof Error)) holsteredSlot.holdables[HoldableSlotType.OffHand] = oh;
//   }
// }
// }
