import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantAttributeRecord } from "../combatants/combatant-attribute-record.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_STARTING_ATTRIBUTES: Record<MonsterType, CombatantAttributeRecord> = {
  [MonsterType.Net]: {
    [CombatAttribute.Speed]: 10,
    [CombatAttribute.Hp]: 3,
  },
  [MonsterType.Wolf]: {
    [CombatAttribute.Vitality]: 1.0,
    [CombatAttribute.ArmorClass]: 15.0,
    [CombatAttribute.Hp]: 45,
    [CombatAttribute.Accuracy]: 70.0,
    [CombatAttribute.Strength]: 10.0,
    [CombatAttribute.Speed]: 1.0,
  },
  [MonsterType.Spider]: {
    [CombatAttribute.Dexterity]: 7.0,
    [CombatAttribute.Strength]: 2.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 35.0,
    [CombatAttribute.Agility]: 2.0,
    [CombatAttribute.Accuracy]: 80.0,
    [CombatAttribute.Mp]: 2.0,
  },
  [MonsterType.FireMage]: {
    [CombatAttribute.Spirit]: 4.0,
    [CombatAttribute.Vitality]: 1.5,
    [CombatAttribute.Hp]: 3.0,
    [CombatAttribute.Accuracy]: 60.0,
    [CombatAttribute.Speed]: 1.0,
  },
  [MonsterType.Cultist]: {
    [CombatAttribute.Spirit]: 6.0,
    [CombatAttribute.Hp]: 40.0,
    [CombatAttribute.Strength]: 20,
    [CombatAttribute.Dexterity]: 20,
    [CombatAttribute.Accuracy]: 0.0,
    [CombatAttribute.Evasion]: 0.0,
    [CombatAttribute.Speed]: 5.0,
  },
  [MonsterType.MantaRay]: {
    [CombatAttribute.Spirit]: 8.0,
    [CombatAttribute.Vitality]: 1.0,
    [CombatAttribute.Hp]: 10.0,
    [CombatAttribute.Accuracy]: 100.0,
    [CombatAttribute.Speed]: 1.0,
  },
};
