import {
  EquipmentType,
  HoldableSlotType,
  MonsterType,
  PreDeterminedItemType,
  TwoHandedMeleeWeapon,
  chooseRandomFromArray,
  generatePreDeterminedItem,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";
import { CombatantEquipment, HoldableHotswapSlot } from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "../item-generation/generate-test-items.js";

export default function getMonsterEquipment(monsterType: MonsterType): CombatantEquipment {
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
    case MonsterType.Cultist:
      const staffOptions = [
        TwoHandedMeleeWeapon.MahoganyStaff,
        TwoHandedMeleeWeapon.ElmStaff,
        TwoHandedMeleeWeapon.EbonyStaff,
        TwoHandedMeleeWeapon.ElementalStaff,
        TwoHandedMeleeWeapon.BoStaff,
      ];
      let staffType = chooseRandomFromArray(staffOptions);
      if (staffType instanceof Error) staffType = TwoHandedMeleeWeapon.BoStaff;

      const mhResult = generateSpecificEquipmentType({
        equipmentType: EquipmentType.TwoHandedMeleeWeapon,
        baseItemType: staffType,
      });
      if (!(mhResult instanceof Error))
        mainHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = mhResult;
      break;
    case MonsterType.FireElemental:
    case MonsterType.IceElemental:
  }

  equipment.inherentHoldableHotswapSlots = [mainHoldableHotswapSlot];
  return equipment;
}
