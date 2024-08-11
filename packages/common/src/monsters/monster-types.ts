import { CombatantClass } from "../combatants";

export enum MonsterType {
  MetallicGolem, // High AC
  Zombie, // 1.25 blunt, .75 slashing, .5 piercing, high HP and vit
  SkeletonArcher, // 1.25 blunt, .75 slashing, .5 piercing, high dex, uses ranged attack
  Scavenger, // medium hp, .5 blunt, 1.25 slashing, 1 piercing
  Vulture, // medium hp, .5 blunt, 1.0 slashing, 1.25 piercing
  FireMage, // low AC and HP, casts fire
  Cultist, // Low AC and HP, casts cure
  FireElemental, // .25 damage from physical, casts fire, weak to ice
  IceElemental, // .25 damage from physical, casts ice, weak to fire
}

export function formatMonsterType(monsterType: MonsterType) {
  switch (monsterType) {
    case MonsterType.MetallicGolem:
      return "Metallic Golem";
    case MonsterType.Zombie:
      return "Zombie";
    case MonsterType.SkeletonArcher:
      return "Skeleton Archer";
    case MonsterType.Scavenger:
      return "Scavenger";
    case MonsterType.Vulture:
      return "Vulture";
    case MonsterType.FireMage:
      return "Fire Mage";
    case MonsterType.Cultist:
      return "Cultist";
    case MonsterType.FireElemental:
      return "Fire Elemental";
    case MonsterType.IceElemental:
      return "Ice Elemental";
  }
}

// export function selectRandomMonsterType(): MonsterType {
//   const r = Math.floor(Math.random() * 100 + 1);
//   if (r >= 1 && r <= 15) return MonsterType.Zombie;
//   if (r >= 16 && r <= 30) return MonsterType.Scavenger;
//   if (r >= 31 && r <= 45) return MonsterType.SkeletonArcher;
//   if (r >= 46 && r <= 60) return MonsterType.Vulture;
//   if (r >= 61 && r <= 70) return MonsterType.FireMage;
//   if (r >= 71 && r <= 80) return MonsterType.Cultist;
//   if (r >= 81 && r <= 85) return MonsterType.FireElemental;
//   if (r >= 86 && r <= 90) return MonsterType.IceElemental;
//   return MonsterType.MetallicGolem;
// }

export function getMonsterCombatantClass(monsterType: MonsterType): CombatantClass {
  switch (monsterType) {
    case MonsterType.MetallicGolem:
    case MonsterType.Zombie:
    case MonsterType.Vulture:
      return CombatantClass.Warrior;
    case MonsterType.SkeletonArcher:
    case MonsterType.Scavenger:
      return CombatantClass.Rogue;
    case MonsterType.FireMage:
    case MonsterType.Cultist:
    case MonsterType.FireElemental:
    case MonsterType.IceElemental:
      return CombatantClass.Mage;
  }
}
