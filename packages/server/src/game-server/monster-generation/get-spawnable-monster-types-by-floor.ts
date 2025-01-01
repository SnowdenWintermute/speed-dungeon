import { MonsterType, iterateNumericEnum } from "@speed-dungeon/common";

export default function getSpawnableMonsterTypesByFloor(floor: number) {
  // if (floor === 1) return [MonsterType.SkeletonArcher, MonsterType.Vulture];
  // if (floor === 1) return [MonsterType.SkeletonArcher, MonsterType.Zombie];
  if (floor === 1) return [MonsterType.MetallicGolem];
  // if (floor === 1) return [MonsterType.MetallicGolem];
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
      MonsterType.Zombie,
      MonsterType.Scavenger,
      MonsterType.SkeletonArcher,
      MonsterType.Vulture,
      MonsterType.FireElemental,
      MonsterType.IceElemental,
    ];
  return iterateNumericEnum(MonsterType);
}
