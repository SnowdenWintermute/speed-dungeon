import { MonsterType, iterateNumericEnum } from "@speed-dungeon/common";

export default function getSpawnableMonsterTypesByFloor(floor: number): MonsterType[] {
  // if (floor === 1) return [MonsterType.SkeletonArcher, MonsterType.Vulture];
  // if (floor === 1) return [MonsterType.SkeletonArcher, MonsterType.Zombie];
  // if (floor === 1) return [MonsterType.Scavenger, MonsterType.Zombie];
  if (floor === 1) return [MonsterType.Scavenger];
  // return [MonsterType.Cultist];
  // if (floor === 1) return [MonsterType.MetallicGolem, MonsterType.FireElemental];
  if (floor === 2)
    return [
      MonsterType.Zombie,
      MonsterType.Scavenger,
      MonsterType.SkeletonArcher,
      MonsterType.Vulture,
    ];
  if (floor === 3)
    return [
      // MonsterType.Zombie,
      MonsterType.Scavenger,
      MonsterType.SkeletonArcher,
      MonsterType.Vulture,
      // MonsterType.FireElemental,
      MonsterType.FireMage,
    ];
  if (floor === 4)
    return [
      // MonsterType.Zombie,
      MonsterType.MetallicGolem,
      MonsterType.Scavenger,
      MonsterType.Cultist,
      // MonsterType.SkeletonArcher,
      MonsterType.Vulture,
      // MonsterType.FireElemental,
      // MonsterType.IceElemental,
    ];
  if (floor === 5)
    return [
      MonsterType.MetallicGolem,
      MonsterType.Vulture,
      MonsterType.Scavenger,
      MonsterType.Cultist,
      MonsterType.IceElemental,
    ];
  if (floor === 6)
    return [
      MonsterType.MetallicGolem,
      MonsterType.Vulture,
      MonsterType.Cultist,
      MonsterType.FireMage,
      MonsterType.FireElemental,
    ];
  if (floor === 7)
    return [
      MonsterType.MetallicGolem,
      MonsterType.SkeletonArcher,
      MonsterType.Zombie,
      MonsterType.FireMage,
      MonsterType.FireElemental,
      MonsterType.IceElemental,
    ];
  return iterateNumericEnum(MonsterType);
}
