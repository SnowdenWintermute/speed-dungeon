import {
  CombatantEquipment,
  HoldableHotswapSlot,
} from "../combatants/combatant-equipment/index.js";
import { EquipmentType } from "../items/equipment/equipment-types/index.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { Shield } from "../items/equipment/equipment-types/shield.js";
import { TwoHandedMeleeWeapon } from "../items/equipment/equipment-types/two-handed-melee-weapon.js";
import {
  generatePreDeterminedItem,
  PreDeterminedItemType,
} from "../items/equipment/pre-determined-items/index.js";
import { HoldableSlotType } from "../items/equipment/slots.js";
import { ItemGenerator } from "../items/item-creation/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { MonsterType } from "./monster-types.js";

export function getMonsterEquipment(
  monsterType: MonsterType,
  idGenerator: IdGenerator,
  itemGenerator: ItemGenerator,
  rng: RandomNumberGenerator
): CombatantEquipment {
  const equipment = new CombatantEquipment();
  const mainHoldableHotswapSlot = new HoldableHotswapSlot();

  switch (monsterType) {
    case MonsterType.FireMage: {
      const staffOptions = [
        TwoHandedMeleeWeapon.MahoganyStaff,
        TwoHandedMeleeWeapon.ElmStaff,
        TwoHandedMeleeWeapon.EbonyStaff,
        TwoHandedMeleeWeapon.ElementalStaff,
        TwoHandedMeleeWeapon.BoStaff,
      ];
      let staffType = ArrayUtils.chooseRandom(staffOptions, rng);
      if (staffType instanceof Error) staffType = TwoHandedMeleeWeapon.BoStaff;

      const mhResult = itemGenerator.generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          baseItemType: staffType,
        },
        {}
      );
      if (!(mhResult instanceof Error))
        mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = mhResult;
      break;
    }
    case MonsterType.Cultist: {
      // const head = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.HeadGear,
      //     baseItemType: HeadGear.Cap,
      //   },
      //   {}
      // );
      // const chest = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.BodyArmor,
      //     baseItemType: BodyArmor.Robe,
      //   },
      //   {}
      // );
      // if (!(chest instanceof Error) && !(head instanceof Error)) {
      //   equipment.wearables[WearableSlotType.Head] = head;
      //   equipment.wearables[WearableSlotType.Body] = chest;
      // }

      const wandOptions = [
        OneHandedMeleeWeapon.RoseWand,
        OneHandedMeleeWeapon.YewWand,
        OneHandedMeleeWeapon.MapleWand,
      ];
      const shieldOptions = [Shield.Buckler, Shield.CabinetDoor, Shield.PotLid];
      let wandType = ArrayUtils.chooseRandom(wandOptions, rng);
      if (wandType instanceof Error) wandType = OneHandedMeleeWeapon.IceBlade;
      let shieldType = ArrayUtils.chooseRandom(shieldOptions, rng);
      if (shieldType instanceof Error) shieldType = Shield.TowerShield;
      const wandResult = itemGenerator.generateSpecificEquipmentType(
        {
          // equipmentType: EquipmentType.TwoHandedRangedWeapon,
          // baseItemType: TwoHandedRangedWeapon.ShortBow,
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.Blade,
          // equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          // baseItemType: TwoHandedMeleeWeapon.RottingBranch,
        },
        {}
      );
      // const wandResult = generateSpecificEquipmentType({
      //   equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      //   baseItemType: TwoHandedMeleeWeapon.Spear,
      // });
      if (!(wandResult instanceof Error))
        mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = wandResult;
      // const shieldResult = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
      //     baseItemType: OneHandedMeleeWeapon.Dagger,
      //   },
      //   {}
      // );
      // if (!(shieldResult instanceof Error)) {
      //   if (shieldResult.durability) shieldResult.durability.current = 2;
      //   mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = shieldResult;
      // }
      break;
    }

    case MonsterType.Wolf:
    case MonsterType.MantaRay:
    case MonsterType.Net:
    case MonsterType.Spider:
  }

  equipment.replaceHoldableSlots([mainHoldableHotswapSlot]);

  return equipment;
}
