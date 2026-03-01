import { CombatantClass } from "../combatants/combatant-class/classes.js";

export enum MonsterType {
  Wolf,
  FireMage, // low AC and HP, casts fire
  Cultist, // Low AC and HP, casts cure
  MantaRay,
  Net,
  Spider,
}

export const MONSTER_TYPE_STRINGS: Record<MonsterType, string> = {
  [MonsterType.Wolf]: "Wolf",
  [MonsterType.FireMage]: "Fire Mage",
  [MonsterType.Cultist]: "Cultist",
  [MonsterType.MantaRay]: "Manta Ray",
  [MonsterType.Net]: "Net",
  [MonsterType.Spider]: "Spider",
};

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
    case MonsterType.Net:
    case MonsterType.Wolf:
      return CombatantClass.Warrior;
    case MonsterType.Spider:
      return CombatantClass.Rogue;
    case MonsterType.FireMage:
    case MonsterType.Cultist:
    case MonsterType.MantaRay:
      return CombatantClass.Mage;
  }
}
