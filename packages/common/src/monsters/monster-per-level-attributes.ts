import { CombatAttribute } from "../combatants/attributes/index.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_ATTRIBUTES_BY_LEVEL: Record<
  MonsterType,
  Partial<Record<CombatAttribute, number>>
> = {
  [MonsterType.Net]: {
    [CombatAttribute.Speed]: 10,
  },
  [MonsterType.Spider]: {
    [CombatAttribute.Dexterity]: 6.0,
    [CombatAttribute.Strength]: 8.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 4.5,
    [CombatAttribute.Mp]: 0.0,
    [CombatAttribute.Agility]: 2.0,
    [CombatAttribute.ArmorClass]: 7.5,
    [CombatAttribute.Evasion]: 12.0,
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
    [CombatAttribute.Hp]: 150.0,
    [CombatAttribute.Agility]: 1.5,
  },
};
