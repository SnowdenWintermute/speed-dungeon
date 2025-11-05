import { CombatantTraitType, MonsterType } from "@speed-dungeon/common";

export const MONSTER_INHERENT_TRAIT_GETTERS: Record<
  MonsterType,
  (level: number) => Partial<Record<CombatantTraitType, number>>
> = {
  [MonsterType.MetallicGolem]: (level) => {
    return {};
  },
  [MonsterType.Zombie]: (level) => {
    return {};
  },
  [MonsterType.SkeletonArcher]: (level) => {
    return {};
  },
  [MonsterType.Scavenger]: (level) => {
    return {};
  },
  [MonsterType.Vulture]: (level) => {
    return {};
  },
  [MonsterType.FireMage]: (level) => {
    return {};
  },
  [MonsterType.FireElemental]: (level) => {
    return {};
  },
  [MonsterType.IceElemental]: (level) => {
    return {};
  },
  [MonsterType.Cultist]: (level) => {
    return {};
  },
  [MonsterType.Wolf]: function (level: number): Partial<Record<CombatantTraitType, number>> {
    return {};
  },
};
