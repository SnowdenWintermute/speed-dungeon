import { CombatantTraitType } from "../combatants/combatant-traits/trait-types.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_INHERENT_TRAIT_GETTERS: Record<
  MonsterType,
  (combatantLevel: number) => Partial<Record<CombatantTraitType, number>>
> = {
  [MonsterType.Net]: (combatantLevel) => {
    return {
      [CombatantTraitType.CanNotBeRestrained]: 1,
    };
  },
  [MonsterType.Spider]: (combatantLevel) => {
    return {
      [CombatantTraitType.CanNotBeRestrained]: 1,
      [CombatantTraitType.IsTameable]: 1,
    };
  },
  [MonsterType.Slime]: (combatantLevel) => {
    return {
      [CombatantTraitType.CanNotBeRestrained]: 1,
    };
  },
  [MonsterType.Zombie]: (combatantLevel) => {
    return {
      [CombatantTraitType.Undead]: 1,
    };
  },
  [MonsterType.SkeletonWarrior]: (combatantLevel) => {
    return {
      [CombatantTraitType.Undead]: 1,
      [CombatantTraitType.Parry]: 1,
    };
  },
  [MonsterType.SkeletonCaptain]: (combatantLevel) => {
    return {
      [CombatantTraitType.Undead]: 1,
      [CombatantTraitType.Parry]: 1,
      [CombatantTraitType.Counterattack]: 1,
    };
  },
  [MonsterType.VampireBat]: () => {
    return {
      [CombatantTraitType.Flyer]: 1,
      [CombatantTraitType.MeleeLifesteal]: 3,
    };
  },
  [MonsterType.TyrantRex]: () => {
    return {};
  },
  [MonsterType.FireMage]: (combatantLevel) => {
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
