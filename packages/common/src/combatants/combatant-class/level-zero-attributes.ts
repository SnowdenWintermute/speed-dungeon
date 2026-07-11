import { CombatAttribute } from "../attributes/index.js";
import { CombatantClass } from "./classes.js";

export const BASE_STARTING_ATTRIBUTES: Record<
  CombatantClass,
  Partial<Record<CombatAttribute, number>>
> = {
  [CombatantClass.Warrior]: {
    [CombatAttribute.Strength]: 3,
    [CombatAttribute.Dexterity]: 1,
    [CombatAttribute.Vitality]: 1,
    [CombatAttribute.Hp]: 20,
    [CombatAttribute.Mp]: 2,
    [CombatAttribute.Accuracy]: 80,
    [CombatAttribute.Speed]: 1.5,
  },
  [CombatantClass.Mage]: {
    [CombatAttribute.Spirit]: 3,
    [CombatAttribute.Hp]: 15,
    [CombatAttribute.Mp]: 4,
    [CombatAttribute.Accuracy]: 70,
    [CombatAttribute.Speed]: 1,
  },
  [CombatantClass.Rogue]: {
    [CombatAttribute.Strength]: 2,
    [CombatAttribute.Dexterity]: 3,
    [CombatAttribute.Hp]: 18,
    [CombatAttribute.Mp]: 3,
    [CombatAttribute.Accuracy]: 90,
    [CombatAttribute.Speed]: 3,
  },
};
