import { IdGenerator } from "../game/id-generator";
import { EquipmentSlot, Item, PreDeterminedItemType, generatePreDeterminedItem } from "../items";
import { MonsterType } from "./monster-types";

export default function getMonsterEquipment(
  monsterType: MonsterType,
  idGenerator: IdGenerator
): Partial<Record<EquipmentSlot, Item>> {
  const equipment: Partial<Record<EquipmentSlot, Item>> = {};
  switch (monsterType) {
    case MonsterType.SkeletonArcher:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.SkeletonArcherShortBow,
        idGenerator
      );
      break;
    case MonsterType.Scavenger:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator
      );
      equipment[EquipmentSlot.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.AnimalClaw,
        idGenerator
      );
      break;
    case MonsterType.Zombie:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator
      );
      equipment[EquipmentSlot.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator
      );
      break;
    case MonsterType.MetallicGolem:
      equipment[EquipmentSlot.MainHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Spike,
        idGenerator
      );
      equipment[EquipmentSlot.OffHand] = generatePreDeterminedItem(
        PreDeterminedItemType.Fist,
        idGenerator
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
