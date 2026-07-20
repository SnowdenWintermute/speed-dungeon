import { CombatantSpecies } from "../combatants/combatant-species.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_SPECIES: Record<MonsterType, CombatantSpecies> = {
  [MonsterType.Wolf]: CombatantSpecies.Canine,
  [MonsterType.FireMage]: CombatantSpecies.Humanoid,
  [MonsterType.Cultist]: CombatantSpecies.Humanoid,
  [MonsterType.MantaRay]: CombatantSpecies.Ray,
  [MonsterType.Net]: CombatantSpecies.Net,
  [MonsterType.Spider]: CombatantSpecies.Spider,
  [MonsterType.Slime]: CombatantSpecies.Slime,
  [MonsterType.Zombie]: CombatantSpecies.Zombie,
  [MonsterType.SkeletonWarrior]: CombatantSpecies.Skeleton,
  [MonsterType.SkeletonCaptain]: CombatantSpecies.Skeleton,
  [MonsterType.VampireBat]: CombatantSpecies.Bat,
  [MonsterType.TyrantRex]: CombatantSpecies.TRex,
};
