import {
  EquipmentSlot,
  Item,
  MonsterType,
  PreDeterminedItemType,
  generatePreDeterminedItem,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";

export default function getMonsterEquipment(
  monsterType: MonsterType
): Partial<Record<EquipmentSlot, Item>> {
  const equipment: Partial<Record<EquipmentSlot, Item>> = {};
  switch (monsterType) {
    case MonsterType.SkeletonArcher:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.SkeletonArcherShortBow,
        idGenerator.generate()
      );
      break;
    case MonsterType.Scavenger:
      // equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
      //   PreDeterminedItemType.SkeletonArcherShortBow,
      //   idGenerator
      // );
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator.generate()
      );
      equipment[EquipmentSlot.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator.generate()
      );
      break;
    case MonsterType.Zombie:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator.generate()
      );
      equipment[EquipmentSlot.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator.generate()
      );
      break;
    case MonsterType.MetallicGolem:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Spike,
        idGenerator.generate()
      );
      equipment[EquipmentSlot.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator.generate()
      );
      break;
    case MonsterType.Vulture:
    case MonsterType.FireMage:
    case MonsterType.Cultist:
    case MonsterType.FireElemental:
    case MonsterType.IceElemental:
  }

  return equipment;
}
