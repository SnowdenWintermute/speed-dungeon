import { CombatAttribute } from "../combatants/index.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_ATTRIBUTES_BY_LEVEL: Record<
  MonsterType,
  Partial<Record<CombatAttribute, number>>
> = {
  [MonsterType.Net]: {
    [CombatAttribute.Speed]: 10,
  },
  [MonsterType.Zombie]: {
    [CombatAttribute.Strength]: 8.0,
    [CombatAttribute.Dexterity]: 2.0,
    [CombatAttribute.Vitality]: 4.0,
    [CombatAttribute.Hp]: 7.0,
    [CombatAttribute.Mp]: 0.0,
    [CombatAttribute.Agility]: 0.5,
    [CombatAttribute.ArmorClass]: 10.0,
    [CombatAttribute.Evasion]: 1.0,
  },
  [MonsterType.SkeletonArcher]: {
    [CombatAttribute.Dexterity]: 12.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 5.5,
    [CombatAttribute.Agility]: 1.5,
    [CombatAttribute.ArmorClass]: 5.0,
    [CombatAttribute.Evasion]: 8.0,
  },
  [MonsterType.Scavenger]: {
    [CombatAttribute.Dexterity]: 6.0,
    [CombatAttribute.Strength]: 8.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 4.5,
    [CombatAttribute.Mp]: 0.0,
    [CombatAttribute.Agility]: 2.0,
    [CombatAttribute.ArmorClass]: 7.5,
    [CombatAttribute.Evasion]: 12.0,
  },
  [MonsterType.Vulture]: {
    [CombatAttribute.Dexterity]: 8.0,
    [CombatAttribute.Strength]: 6.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 4.5,
    [CombatAttribute.Agility]: 1.5,
    [CombatAttribute.ArmorClass]: 7.5,
    [CombatAttribute.Evasion]: 14.0,
  },
  [MonsterType.FireMage]: {
    [CombatAttribute.Spirit]: 10.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 4.5,
    [CombatAttribute.Agility]: 1.5,
    [CombatAttribute.ArmorClass]: 2.5,
    [CombatAttribute.Evasion]: 1.0,
  },
  [MonsterType.Cultist]: {
    [CombatAttribute.Spirit]: 14.0,
    [CombatAttribute.Hp]: 0.0,
    [CombatAttribute.Agility]: 1.5,
    [CombatAttribute.Evasion]: 0.0,
  },
  [MonsterType.FireElemental]: {
    [CombatAttribute.Spirit]: 6.0,
    [CombatAttribute.Vitality]: 1.0,
    [CombatAttribute.Hp]: 4.0,
    [CombatAttribute.Agility]: 1.5,
  },
  [MonsterType.IceElemental]: {
    [CombatAttribute.Spirit]: 6.0,
    [CombatAttribute.Vitality]: 1.0,
    [CombatAttribute.Hp]: 4.0,
    [CombatAttribute.Agility]: 1.5,
  },
  [MonsterType.MetallicGolem]: {
    [CombatAttribute.Dexterity]: 4.0,
    [CombatAttribute.Strength]: 14.0,
    [CombatAttribute.Vitality]: 2.0,
    [CombatAttribute.ArmorClass]: 18.0,
    [CombatAttribute.Hp]: 9.5,
    [CombatAttribute.Agility]: 1.5,
  },
  [MonsterType.Wolf]: {
    [CombatAttribute.Dexterity]: 8.0,
    [CombatAttribute.Strength]: 7.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 4.5,
    [CombatAttribute.Mp]: 0.0,
    [CombatAttribute.Agility]: 2.0,
    [CombatAttribute.ArmorClass]: 4.5,
    [CombatAttribute.Evasion]: 10.0,
  },
  [MonsterType.MantaRay]: {
    [CombatAttribute.Spirit]: 6.0,
    [CombatAttribute.Vitality]: 1.0,
    [CombatAttribute.Hp]: 4.0,
    [CombatAttribute.Agility]: 1.5,
  },
};
