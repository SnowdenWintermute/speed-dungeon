import { CombatAttribute } from "../combat-attributes.js";
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
    [CombatAttribute.Accuracy]: 75,
    [CombatAttribute.Speed]: 1.5,
  },
  [CombatantClass.Mage]: {
    [CombatAttribute.Intelligence]: 3,
    [CombatAttribute.Focus]: 2,
    [CombatAttribute.Hp]: 15,
    [CombatAttribute.Mp]: 4,
    [CombatAttribute.Accuracy]: 65,
    [CombatAttribute.Speed]: 1,
  },
  [CombatantClass.Rogue]: {
    [CombatAttribute.Strength]: 2,
    [CombatAttribute.Dexterity]: 3,
    [CombatAttribute.Hp]: 17,
    [CombatAttribute.Mp]: 3,
    [CombatAttribute.Accuracy]: 85,
    [CombatAttribute.Speed]: 2,
  },
};
