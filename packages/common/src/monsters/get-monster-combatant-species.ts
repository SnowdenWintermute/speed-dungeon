import { CombatantSpecies } from "../combatants/index.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_SPECIES: Record<MonsterType, CombatantSpecies> = {
  [MonsterType.MetallicGolem]: CombatantSpecies.Golem,
  [MonsterType.Wolf]: CombatantSpecies.Canine,
  [MonsterType.Zombie]: CombatantSpecies.Skeleton,
  [MonsterType.SkeletonArcher]: CombatantSpecies.Skeleton,
  [MonsterType.Scavenger]: CombatantSpecies.Velociraptor,
  [MonsterType.Vulture]: CombatantSpecies.Dragon,
  [MonsterType.FireMage]: CombatantSpecies.Humanoid,
  [MonsterType.Cultist]: CombatantSpecies.Humanoid,
  [MonsterType.IceElemental]: CombatantSpecies.Elemental,
  [MonsterType.FireElemental]: CombatantSpecies.Elemental,
};
