import { CombatantSpecies } from "../combatants/combatant-species.js";
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
  [MonsterType.MantaRay]: CombatantSpecies.Ray,
  [MonsterType.Net]: CombatantSpecies.Net,
  [MonsterType.Spider]: CombatantSpecies.Spider,
};
