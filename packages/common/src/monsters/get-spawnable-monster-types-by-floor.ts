import { iterateNumericEnum } from "../utils";
import { MonsterType } from "./monster-types";

export default function getSpawnableMonsterTypesByFloor(floor: number) {
  if (floor === 1) return [MonsterType.FireMage, MonsterType.Cultist];
  // if (floor === 1) return [MonsterType.Zombie, MonsterType.Scavenger];
  if (floor === 2)
    return [
      MonsterType.Zombie,
      MonsterType.Scavenger,
      MonsterType.SkeletonArcher,
      MonsterType.Vulture,
    ];
  if (floor === 3)
    return [
      MonsterType.Zombie,
      MonsterType.Scavenger,
      MonsterType.SkeletonArcher,
      MonsterType.Vulture,
      MonsterType.FireElemental,
      MonsterType.IceElemental,
    ];
  return iterateNumericEnum(MonsterType);
}
