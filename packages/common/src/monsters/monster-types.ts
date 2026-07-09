import { CombatantClass } from "../combatants/combatant-class/classes.js";

export enum MonsterType {
  Wolf,
  FireMage, // low AC and HP, casts fire
  Cultist, // Low AC and HP, casts cure
  MantaRay,
  Net,
  Spider,
  Slime,
  Zombie,
  SkeletonWarrior,
  SkeletonCaptain,
}

export const MONSTER_TYPE_STRINGS: Record<MonsterType, string> = {
  [MonsterType.Wolf]: "Wolf",
  [MonsterType.FireMage]: "Fire Mage",
  [MonsterType.Cultist]: "Cultist",
  [MonsterType.MantaRay]: "Manta Ray",
  [MonsterType.Net]: "Net",
  [MonsterType.Spider]: "Spider",
  [MonsterType.Slime]: "Slime",
  [MonsterType.Zombie]: "Zombie",
  [MonsterType.SkeletonWarrior]: "Skeleton Warrior",
  [MonsterType.SkeletonCaptain]: "Skeleton Captain",
};

export function getMonsterCombatantClass(monsterType: MonsterType): CombatantClass {
  switch (monsterType) {
    case MonsterType.Net:
    case MonsterType.Wolf:
    case MonsterType.Zombie:
    case MonsterType.SkeletonWarrior:
    case MonsterType.SkeletonCaptain:
      return CombatantClass.Warrior;
    case MonsterType.Spider:
      return CombatantClass.Rogue;
    case MonsterType.FireMage:
    case MonsterType.Cultist:
    case MonsterType.MantaRay:
    case MonsterType.Slime:
      return CombatantClass.Mage;
  }
}
