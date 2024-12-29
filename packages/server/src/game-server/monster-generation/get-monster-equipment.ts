import {
  HoldableSlotType,
  MonsterType,
  PreDeterminedItemType,
  generatePreDeterminedItem,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";
import { CombatantEquipment, HoldableHotswapSlot } from "@speed-dungeon/common";

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
    case MonsterType.FireElemental:
    case MonsterType.IceElemental:
  }

  equipment.inherentHoldableHotswapSlots = [mainHoldableHotswapSlot];
  return equipment;
}
