import { CombatantTraitType, MonsterType } from "@speed-dungeon/common";

export const MONSTER_INHERENT_TRAIT_GETTERS: Record<
  MonsterType,
  (combatantLevel: number) => Partial<Record<CombatantTraitType, number>>
> = {
  [MonsterType.MetallicGolem]: (combatantLevel) => {
    return {};
  },
  [MonsterType.Zombie]: (combatantLevel) => {
    return { [CombatantTraitType.Undead]: 1 };
  },
  [MonsterType.SkeletonArcher]: (combatantLevel) => {
    return {};
  },
  [MonsterType.Scavenger]: (combatantLevel) => {
    return {};
  },
  [MonsterType.Net]: (combatantLevel) => {
    return {};
  },
  [MonsterType.Vulture]: (combatantLevel) => {
    return {};
  },
  [MonsterType.FireMage]: (combatantLevel) => {
    return {};
  },
  [MonsterType.FireElemental]: (combatantLevel) => {
    return {};
  },
  [MonsterType.IceElemental]: (combatantLevel) => {
    return {};
  },
  [MonsterType.Cultist]: (combatantLevel) => {
    return {};
  },
  [MonsterType.Wolf]: function (
    combatantLevel: number
  ): Partial<Record<CombatantTraitType, number>> {
    return { [CombatantTraitType.IsTameable]: 0 };
  },
  [MonsterType.MantaRay]: function (
    combatantLevel: number
  ): Partial<Record<CombatantTraitType, number>> {
    return { [CombatantTraitType.IsTameable]: 0, [CombatantTraitType.Flyer]: 0 };
  },
};
