import {
  ArrayUtils,
  BodyArmor,
  EquipmentType,
  HeadGear,
  HoldableSlotType,
  MonsterType,
  OneHandedMeleeWeapon,
  PreDeterminedItemType,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  WearableSlotType,
  generatePreDeterminedItem,
} from "@speed-dungeon/common";
import { idGenerator, rngSingleton } from "../../singletons/index.js";
import { CombatantEquipment, HoldableHotswapSlot } from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "../item-generation/generate-test-items.js";

export function getMonsterEquipment(monsterType: MonsterType): CombatantEquipment {
  const equipment = new CombatantEquipment();
  const mainHoldableHotswapSlot = new HoldableHotswapSlot();

  switch (monsterType) {
    case MonsterType.SkeletonArcher:
      mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.SkeletonArcherShortBow,
        idGenerator.generate()
      );
      break;
    case MonsterType.Scavenger:
      // equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
      //   PreDeterminedItemType.SkeletonArcherShortBow,
      //   idGenerator
      // );
      mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator.generate()
      );
      mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator.generate()
      );
      break;
    case MonsterType.Zombie:
      mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator.generate()
      );
      mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator.generate()
      );
      break;
    case MonsterType.MetallicGolem:
      mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Spike,
        idGenerator.generate()
      );
      mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator.generate()
      );
      break;
    case MonsterType.Vulture:
      mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator.generate()
      );
      mainHoldableHotswapSlot.holdables[HoldableSlotType.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator.generate()
      );
      break;
    case MonsterType.FireMage:
      const staffOptions = [
        TwoHandedMeleeWeapon.MahoganyStaff,
        TwoHandedMeleeWeapon.ElmStaff,
        TwoHandedMeleeWeapon.EbonyStaff,
        TwoHandedMeleeWeapon.ElementalStaff,
        TwoHandedMeleeWeapon.BoStaff,
      ];
      let staffType = ArrayUtils.chooseRandom(staffOptions, rngSingleton);
      if (staffType instanceof Error) staffType = TwoHandedMeleeWeapon.BoStaff;

      const mhResult = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          baseItemType: staffType,
        },
        {}
      );
      if (!(mhResult instanceof Error))
        mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = mhResult;
      break;
    case MonsterType.Cultist:
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
      let wandType = ArrayUtils.chooseRandom(wandOptions, rngSingleton);
      if (wandType instanceof Error) wandType = OneHandedMeleeWeapon.IceBlade;
      let shieldType = ArrayUtils.chooseRandom(shieldOptions, rngSingleton);
      if (shieldType instanceof Error) shieldType = Shield.TowerShield;
      const wandResult = generateSpecificEquipmentType(
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

    case MonsterType.FireElemental:
    case MonsterType.IceElemental:
  }

  equipment.inherentHoldableHotswapSlots = [mainHoldableHotswapSlot];
  return equipment;
}
