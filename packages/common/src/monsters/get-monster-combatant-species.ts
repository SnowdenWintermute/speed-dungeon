import { CombatantSpecies } from "../combatants/index.js";
import { MonsterType } from "./monster-types.js";

export default function getMonsterCombatantSpecies(monsterType: MonsterType) {
  switch (monsterType) {
    case MonsterType.MetallicGolem:
      return CombatantSpecies.Golem;
    case MonsterType.Zombie:
    case MonsterType.SkeletonArcher:
      return CombatantSpecies.Skeleton;
    case MonsterType.Scavenger:
      return CombatantSpecies.Velociraptor;
    case MonsterType.Vulture:
      return CombatantSpecies.Dragon;
    case MonsterType.FireMage:
    case MonsterType.Cultist:
      return CombatantSpecies.Humanoid;
    case MonsterType.FireElemental:
    case MonsterType.IceElemental:
      return CombatantSpecies.Elemental;
  }
}
