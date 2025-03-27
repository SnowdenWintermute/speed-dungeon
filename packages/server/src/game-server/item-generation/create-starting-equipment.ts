import {
  AffixType,
  Amulet,
  BodyArmor,
  CombatantClass,
  CombatantProperties,
  ERROR_MESSAGES,
  Equipment,
  EquipmentTraitType,
  EquipmentType,
  HeadGear,
  HoldableSlotType,
  OneHandedMeleeWeapon,
  PrefixType,
  Ring,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  WearableSlotType,
} from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "./generate-test-items.js";
import { CombatantEquipment } from "@speed-dungeon/common";
import { repairEquipment } from "../game-event-handlers/craft-item-handler/repair-equipment.js";

export default function createStartingEquipment(combatantProperties: CombatantProperties) {
  const startingEquipment = new CombatantEquipment();

  let mainhand: Equipment | Error | undefined, offhand: Equipment | Error | undefined;
  switch (combatantProperties.combatantClass) {
    case CombatantClass.Warrior:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.ShortSpear,
        },
        true
      );
      offhand = generateSpecificEquipmentType(
        { equipmentType: EquipmentType.Shield, baseItemType: Shield.KiteShield },
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
      // mainhand = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
      //     baseItemType: OneHandedMeleeWeapon.ButterKnife,
      //   },
      //   true
      // );
      // offhand = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
      //     baseItemType: OneHandedMeleeWeapon.ButterKnife,
      //   },
      //   true
      // );
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.TwoHandedRangedWeapon,
          baseItemType: TwoHandedRangedWeapon.ShortBow,
        },
        true
      );
      // offhand = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
      //     baseItemType: OneHandedMeleeWeapon.ButterKnife,
      //   },
      //   true
      // );
      break;
  }

  if (mainhand instanceof Error) return mainhand;
  //@ts-ignore
  console.log("created bow: ", mainhand.equipmentBaseItemProperties.damageClassification);
  mainhand.affixes[AffixType.Prefix][PrefixType.LifeSteal] = {
    combatAttributes: {},
    tier: 1,
    equipmentTraits: {
      [EquipmentTraitType.LifeSteal]: {
        equipmentTraitType: EquipmentTraitType.LifeSteal,
        value: 10,
      },
    },
  };
  mainhand.durability = { current: 10000, inherentMax: 10000 };
  // if(mainhand.tra)
  // mainhand.equipmentBaseItemProperties

  // @TODO - remove this testing line and put back the repair all one
  // if (mainhand.durability) mainhand.durability.current = 1;

  if (offhand instanceof Error) return offhand;

  repairEquipment(mainhand);
  if (offhand) repairEquipment(offhand);

  const mainHoldableHotswapSlot = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!mainHoldableHotswapSlot) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);

  if (mainhand) mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = mainhand;
  if (offhand) mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = offhand;

  return startingEquipment;
}

export function givePlaytestingItems(combatantEquipment: CombatantEquipment) {
  const bodyResult = generateSpecificEquipmentType({
    equipmentType: EquipmentType.BodyArmor,
    baseItemType: BodyArmor.Rags,
  });
  if (bodyResult instanceof Error) return;
  bodyResult.durability = { current: 2, inherentMax: 6 };

  combatantEquipment.wearables[WearableSlotType.Body] = bodyResult;

  const helmResult = generateSpecificEquipmentType({
    equipmentType: EquipmentType.HeadGear,
    baseItemType: HeadGear.Cap,
  });
  if (helmResult instanceof Error) return;
  helmResult.durability = { current: 1, inherentMax: 3 };

  combatantEquipment.wearables[WearableSlotType.Head] = helmResult;

  const ring = generateSpecificEquipmentType({
    equipmentType: EquipmentType.Ring,
    baseItemType: Ring.Ring,
  });
  if (ring instanceof Error) return;
  ring.itemLevel = 10;
  combatantEquipment.wearables[WearableSlotType.RingL] = ring;

  const amulet = generateSpecificEquipmentType({
    equipmentType: EquipmentType.Amulet,
    baseItemType: Amulet.Amulet,
  });
  if (amulet instanceof Error) return;
  amulet.itemLevel = 5;
  combatantEquipment.wearables[WearableSlotType.Amulet] = amulet;
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
